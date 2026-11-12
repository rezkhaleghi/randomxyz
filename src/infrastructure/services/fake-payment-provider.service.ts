import { Injectable, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { randomUUID } from "crypto";

import {
  CreatePaymentInput,
  CreatePaymentResult,
  PaymentProviderInterface,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from "@application/interfaces/payment-provider.interface";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

@Injectable()
export class FakePaymentProvider implements PaymentProviderInterface {
  readonly name = PaymentProvider.FAKE_PROVIDER;
  readonly supportedCurrencies = [PaymentCurrency.USD, PaymentCurrency.IRT];

  constructor(
    @Optional()
    private readonly configService?: ConfigService,
  ) {}

  async createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
    this.assertEnabledOutsideProduction();

    const providerPaymentId = `fake-payment-${randomUUID()}`;
    const checkoutUrl = new URL(input.callbackUrl);

    if (!checkoutUrl.pathname.endsWith("/callback")) {
      throw new Error("Fake payment callback URL must end with /callback.");
    }

    checkoutUrl.pathname = checkoutUrl.pathname.replace(
      /\/callback$/,
      "/checkout",
    );
    checkoutUrl.search = "";
    checkoutUrl.searchParams.set("merchantOrderId", input.merchantOrderId);
    checkoutUrl.searchParams.set("providerPaymentId", providerPaymentId);

    return {
      providerPaymentId,
      paymentUrl: checkoutUrl.toString(),
    };
  }

  async verifyPayment(
    _input: VerifyPaymentInput,
  ): Promise<VerifyPaymentResult> {
    this.assertEnabledOutsideProduction();

    return {
      transactionId: `fake-tx-${randomUUID()}`,
      providerResponse: {
        provider: PaymentProvider.FAKE_PROVIDER,
        simulated: true,
      },
    };
  }

  private assertEnabledOutsideProduction(): void {
    const nodeEnv =
      this.configService?.get<string>("NODE_ENV") ?? process.env.NODE_ENV;

    if (nodeEnv !== "development" && nodeEnv !== "test") {
      throw new Error(
        "Fake payment provider is disabled. Use a real payment provider outside development/test.",
      );
    }
  }
}
