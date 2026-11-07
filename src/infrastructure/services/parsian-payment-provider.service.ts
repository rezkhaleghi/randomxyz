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
  [key: string]: unknown;
}

interface ParsianSoapClient {
  SalePaymentRequestAsync(input: {
    requestData: {
      LoginAccount: string;
      OrderId: number;
      Amount: number;
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

    if (!input.providerOrderId || !/^\d+$/.test(input.providerOrderId)) {
      throw new Error("A numeric Parsian order ID is required.");
    }

    const orderId = Number(input.providerOrderId);
    const amountInRial = Number(tomanToRialAmount(input.amount));

    if (
      !Number.isSafeInteger(orderId) ||
      orderId <= 0 ||
      orderId > 2_147_483_647
    ) {
      throw new Error("Invalid Parsian order ID.");
    }

    if (!Number.isSafeInteger(amountInRial) || amountInRial <= 0) {
      throw new Error("Invalid Parsian payment amount.");
    }

    try {
      const client = (await soap.createClientAsync(
        this.configService.getOrThrow("PARSIAN_SALE_URL"),
      )) as unknown as ParsianSoapClient;

      const response = await client.SalePaymentRequestAsync({
        requestData: {
          LoginAccount: this.configService.getOrThrow("PARSIAN_PIN"),
          OrderId: orderId,
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

      const envelope = response?.[0] as {
        ConfirmPaymentResult?: ParsianConfirmPaymentResult;
      };

      const result = envelope?.ConfirmPaymentResult;

      // Log the complete confirmation response after removing sensitive fields.
      const safeResponse = this.sanitizeProviderValue(
        result ?? envelope ?? response,
      );

      this.logger.log(
        `ConfirmPayment response: ${JSON.stringify(safeResponse)}`,
      );

      if (!result || Number(result.Status) !== 0) {
        throw new Error(
          `Parsian did not confirm the payment. Status: ${result?.Status ?? "missing"}`,
        );
      }

      return {
        transactionId: this.extractTransactionId(result),
        providerResponse: this.toProviderResponse(safeResponse),
      };
    } catch (error) {
      this.logProviderError("ConfirmPayment", error);
      throw new Error("Unable to confirm Parsian payment.");
    }
  }

  private extractTransactionId(
    result: ParsianConfirmPaymentResult,
  ): string | undefined {
    const possibleFields = [
      "RRN",
      "Rrn",
      "rrn",
      "TransactionId",
      "TransactionID",
      "transactionId",
      "ReferenceNumber",
    ];

    for (const field of possibleFields) {
      const value = result[field];

      if (
        (typeof value === "string" || typeof value === "number") &&
        String(value).trim() !== ""
      ) {
        return String(value).trim();
      }
    }

    return undefined;
  }

  private sanitizeProviderValue(value: unknown, key = ""): unknown {
    if (
      /pin|password|cvv|cvc|security.?code|token|authorization|secret/i.test(
        key,
      )
    ) {
      return "[REDACTED]";
    }

    if (/card.?number|cardnumber|^pan$/i.test(key)) {
      const digits = String(value ?? "").replace(/\D/g, "");
      return digits.length >= 4
        ? `************${digits.slice(-4)}`
        : "[REDACTED]";
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeProviderValue(item));
    }

    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.entries(value).map(([childKey, childValue]) => [
          childKey,
          this.sanitizeProviderValue(childValue, childKey),
        ]),
      );
    }

    return value;
  }

  private toProviderResponse(value: unknown): Record<string, unknown> {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }

    return { response: value };
  }

  private logProviderError(operation: string, error: unknown): void {
    const message =
      error instanceof Error ? error.message : "Unknown provider error";

    const pin = this.configService.get("PARSIAN_PIN") ?? "";
    const safeMessage = pin ? message.replaceAll(pin, "[REDACTED]") : message;

    this.logger.error(`${operation} failed: ${safeMessage}`);
  }
}
