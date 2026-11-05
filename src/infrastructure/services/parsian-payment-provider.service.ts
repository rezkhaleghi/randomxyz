import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as soap from "soap";

import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderInterface,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@application/interfaces/payment-provider.interface";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";
import { tomanToRialAmount } from "@domain/utils/decimal.util";

interface ParsianSalePaymentResult {
  Status?: string | number;
  Token?: string | number;
}

interface ParsianConfirmPaymentResult {
  Status?: string | number;
}

interface ParsianSoapClient {
  SalePaymentRequestAsync(input: {
    requestData: {
      LoginAccount: string;
      OrderId: string;
      Amount: string;
      CallBackUrl: string;
    };
  }): Promise<unknown[]>;

  ConfirmPaymentAsync(input: {
    requestData: {
      LoginAccount: string;
      Token: string;
    };
  }): Promise<unknown[]>;
}

@Injectable()
export class ParsianPaymentProvider implements PaymentProviderInterface {
  private readonly logger = new Logger(ParsianPaymentProvider.name);

  readonly name = PaymentProvider.PARSIAN;
  readonly supportedCurrencies = [PaymentCurrency.IRT];

  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    if (input.currency !== PaymentCurrency.IRT) {
      throw new Error("Parsian supports IRT deposits only.");
    }

    const amountInRial = tomanToRialAmount(input.amount);

    try {
      const client = (await soap.createClientAsync(
        this.configService.getOrThrow("PARSIAN_SALE_URL"),
      )) as unknown as ParsianSoapClient;

      const response = await client.SalePaymentRequestAsync({
        requestData: {
          LoginAccount: this.configService.getOrThrow("PARSIAN_PIN"),
          OrderId: input.referenceId,
          Amount: amountInRial,
          CallBackUrl: input.callbackUrl,
        },
      });

      const result = (
        response?.[0] as {
          SalePaymentRequestResult?: ParsianSalePaymentResult;
        }
      )?.SalePaymentRequestResult;

      if (!result || Number(result.Status) !== 0) {
        throw new Error(
          `Parsian rejected the sale payment request. Status: ${result?.Status ?? "missing"}`,
        );
      }

      if (
        result.Token === undefined ||
        result.Token === null ||
        String(result.Token).trim() === ""
      ) {
        throw new Error("Parsian did not return a payment token.");
      }

      const token = String(result.Token);

      return {
        providerPaymentId: token,
        paymentUrl: `https://pec.shaparak.ir/NewIPG/?token=${encodeURIComponent(token)}`,
      };
    } catch (error) {
      this.logProviderError("SalePaymentRequest", error);

      throw new Error("Unable to create Parsian payment.");
    }
  }

  async verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult> {
    try {
      const client = (await soap.createClientAsync(
        this.configService.getOrThrow("PARSIAN_CONFIRM_URL"),
      )) as unknown as ParsianSoapClient;

      const response = await client.ConfirmPaymentAsync({
        requestData: {
          LoginAccount: this.configService.getOrThrow("PARSIAN_PIN"),
          Token: input.providerPaymentId,
        },
      });

      const result = (
        response?.[0] as {
          ConfirmPaymentResult?: ParsianConfirmPaymentResult;
        }
      )?.ConfirmPaymentResult;

      if (!result || Number(result.Status) !== 0) {
        throw new Error(
          `Parsian did not confirm the payment. Status: ${result?.Status ?? "missing"}`,
        );
      }

      return {};
    } catch (error) {
      this.logProviderError("ConfirmPayment", error);

      throw new Error("Unable to confirm Parsian payment.");
    }
  }

  private logProviderError(operation: string, error: unknown): void {
    const message =
      error instanceof Error ? error.message : "Unknown provider error";

    const pin = this.configService.get("PARSIAN_PIN") ?? "";
    const safeMessage = pin ? message.replaceAll(pin, "[REDACTED]") : message;

    this.logger.error(`${operation} failed: ${safeMessage}`);
  }
}
