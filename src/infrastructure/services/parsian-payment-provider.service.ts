import { Injectable } from "@nestjs/common";
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

      if (
        !result ||
        Number(result.Status) !== 0 ||
        result.Token === undefined ||
        result.Token === null ||
        String(result.Token).trim() === ""
      ) {
        throw new Error("Parsian did not create the payment.");
      }

      const token = String(result.Token);

      return {
        provider: this.name,
        providerPaymentId: token,
        paymentUrl: `https://pec.shaparak.ir/NewIPG/?token=${encodeURIComponent(token)}`,
      };
    } catch {
      // Never expose SOAP faults, credentials, or payment tokens in API errors.
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
        throw new Error("Parsian did not confirm the payment.");
      }

      return {
        providerPaymentId: input.providerPaymentId,
        transactionId: input.transactionId,
        amount: input.amount,
        currency: input.currency,
      };
    } catch {
      throw new Error("Unable to confirm Parsian payment.");
    }
  }
}
