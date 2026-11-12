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
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

import { HandleParsianCallbackUseCase } from "@application/use-cases/deposits/handle-parsian-callback.use-case";
import { HandleFakeCallbackUseCase } from "@application/use-cases/deposits/handle-fake-callback.use-case";

import { FakeCheckoutPage } from "./fake-checkout-page";

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

  @Get(`${PaymentProvider.FAKE_PROVIDER}/checkout`)
  fakeCheckout(
    @Query("merchantOrderId") merchantOrderId: string,
    @Query("providerPaymentId") providerPaymentId: string,
    @Res() response: Response,
  ): void {
    this.ensureFakeProviderEnabled();

    if (
      !merchantOrderId ||
      !providerPaymentId ||
      !/^fake-payment-[0-9a-f-]+$/i.test(providerPaymentId)
    ) {
      response.status(400).send("Invalid fake payment request.");
      return;
    }

    const backendUrl = this.configService
      .getOrThrow<string>("BACKEND_URL")
      .replace(/\/+$/, "");

    // BACKEND_URL already includes /api/permit.
    const callbackUrl = `${backendUrl}/deposits/${PaymentProvider.FAKE_PROVIDER}/callback`;

    response.setHeader("Cache-Control", "no-store");

    response
      .type("html")
      .send(
        FakeCheckoutPage.render(
          callbackUrl,
          merchantOrderId,
          providerPaymentId,
        ),
      );
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

  private ensureFakeProviderEnabled(): void {
    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenException(
        "Fake payment provider is not available in production.",
      );
    }
  }

  private redirectToWallet(
    response: Response,
    status?: DepositStatus,
    verificationFailed = false,
  ): void {
    const frontendUrl = this.configService
      .getOrThrow<string>("FRONTEND_URL")
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

    const safeRedirectUrl = redirectUrl.toString().replace(/&/g, "&amp;");

    response.status(200).type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="refresh" content="0;url=${safeRedirectUrl}" />
  <title>Redirecting...</title>
</head>
<body>
  <p>Payment processed. Redirecting...</p>
  <script>
    window.location.replace(${JSON.stringify(redirectUrl.toString())});
  </script>
</body>
</html>`);
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
