import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Logger,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";

import { EnvironmentConfig } from "@infrastructure/config/environment.config";
import { DepositStatus } from "@domain/enums/deposit-status.enum";

import { HandleParsianCallbackUseCase } from "@application/use-cases/deposits/handle-parsian-callback.use-case";
import { HandleFakeCallbackUseCase } from "@application/use-cases/deposits/handle-fake-callback.use-case";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

@Controller("deposits")
export class CallbackController {
  private readonly logger = new Logger(CallbackController.name);

  constructor(
    private readonly handleParsianCallbackUseCase: HandleParsianCallbackUseCase,
    private readonly handleFakeCallbackUseCase: HandleFakeCallbackUseCase,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {}

  @Post(`${PaymentProvider.PARSIAN}/callback`)
  async parsianCallback(
    @Body() body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    try {
      const deposit = await this.handleParsianCallbackUseCase.execute(body);

      this.redirectToWallet(response, deposit.status);
    } catch (error) {
      this.logger.warn(
        `Parsian callback could not be processed: ${this.errorMessage(error)}`,
      );

      this.redirectToWallet(response, undefined, true);
    }
  }

  @Post(`${PaymentProvider.FAKE_PROVIDER}/callback`)
  async fakeCallback(
    @Body() body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    this.ensureFakeProviderEnabled();

    try {
      const deposit = await this.handleFakeCallbackUseCase.execute(body);

      this.redirectToWallet(response, deposit.status);
    } catch (error) {
      this.logger.warn(
        `Fake payment callback could not be processed: ${this.errorMessage(error)}`,
      );

      this.redirectToWallet(response, undefined, true);
    }
  }

  @Get(`${PaymentProvider.FAKE_PROVIDER}/checkout`)
  fakeCheckout(
    @Query("referenceId") referenceId: string,
    @Query("providerPaymentId") providerPaymentId: string,
    @Res() response: Response,
  ): void {
    this.ensureFakeProviderEnabled();

    if (
      !referenceId ||
      !providerPaymentId ||
      !/^fake-payment-[0-9a-f-]+$/i.test(providerPaymentId)
    ) {
      response.status(400).send("Invalid fake payment request.");
      return;
    }

    const backendUrl = this.configService
      .getOrThrow("BACKEND_URL")
      .replace(/\/+$/, "");

    // NestJS global prefix is /api/permit.
    const apiBaseUrl = backendUrl.endsWith("/api/permit")
      ? backendUrl
      : `${backendUrl}/api/permit`;

    const callbackUrl = `${apiBaseUrl}/deposits/${PaymentProvider.FAKE_PROVIDER}/callback`;

    const safeReferenceId = this.escapeHtml(referenceId);
    const safePaymentId = this.escapeHtml(providerPaymentId);
    const safeCallbackUrl = this.escapeHtml(callbackUrl);

    response.type("html").send(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Fake Payment Gateway</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              background: #f3f4f6;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
            }
            .container {
              background: white;
              width: min(420px, calc(100% - 40px));
              padding: 32px;
              border-radius: 12px;
              box-shadow: 0 8px 30px rgba(0, 0, 0, .08);
              box-sizing: border-box;
              text-align: center;
            }
            h1 { margin-top: 0; }
            p { color: #555; line-height: 1.5; }
            button {
              width: 100%;
              padding: 13px;
              border: 0;
              border-radius: 8px;
              color: white;
              font-size: 15px;
              cursor: pointer;
              margin-top: 12px;
            }
            .complete { background: #16834a; }
            .cancel { background: #b42318; }
            .notice {
              font-size: 12px;
              color: #888;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <main class="container">
            <h1>Fake Payment Gateway</h1>
            <p>This page simulates a payment gateway for development and testing.</p>

            <form method="POST" action="${safeCallbackUrl}">
              <input type="hidden" name="referenceId" value="${safeReferenceId}" />
              <input type="hidden" name="providerPaymentId" value="${safePaymentId}" />

              <button class="complete" type="submit" name="status" value="0">
                Complete Payment
              </button>

              <button class="cancel" type="submit" name="status" value="1">
                Cancel Payment
              </button>
            </form>

            <p class="notice">Development / test environment only</p>
          </main>
        </body>
      </html>
    `);
  }

  private ensureFakeProviderEnabled(): void {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException(
        "Fake payment provider is disabled in production.",
      );
    }
  }

  private redirectToWallet(
    response: Response,
    status?: DepositStatus,
    verificationFailed = false,
  ): void {
    const frontendUrl = this.configService
      .getOrThrow("FRONTEND_URL")
      .replace(/\/+$/, "");

    const redirectUrl = new URL(
      "/trip-permit/wallet?tab=deposits",
      `${frontendUrl}/`,
    );

    if (verificationFailed) {
      redirectUrl.searchParams.set("paymentStatus", "verification_failed");
    } else if (status === DepositStatus.FAILED) {
      redirectUrl.searchParams.set("paymentStatus", "failed");
    }

    response.status(200).type("html").send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="refresh" content="0;url=${this.escapeHtml(redirectUrl.toString())}" />
        <title>Redirecting...</title>
      </head>
      <body>
        <p>Payment processed. Redirecting...</p>
        <script>
          window.location.replace(${JSON.stringify(redirectUrl.toString())});
        </script>
      </body>
    </html>
  `);
  }

  private escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
      const entities: Record<string, string> = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[character];
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : "Unknown error";
  }
}
