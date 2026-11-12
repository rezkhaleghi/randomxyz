import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

export interface CreatePaymentInput {
  amount: string;
  currency: PaymentCurrency;
  merchantOrderId: string;
  callbackUrl: string;
}

export interface CreatePaymentResult {
  providerPaymentId: string;
  paymentUrl?: string;
}

export interface VerifyPaymentInput {
  merchantOrderId: string;
  providerPaymentId: string;
}

export interface VerifyPaymentResult {
  transactionId?: string;
  providerResponse?: Record<string, unknown>;
}

export interface PaymentProviderInterface {
  readonly name: PaymentProvider;
  readonly supportedCurrencies: PaymentCurrency[];

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}
