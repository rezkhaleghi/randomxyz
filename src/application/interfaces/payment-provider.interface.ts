import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export interface CreatePaymentInput {
  amount: string;
  currency: PaymentCurrency;
  provider: PaymentProvider;
  referenceId: string;
  idempotencyKey: string;
  callbackUrl: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentResult {
  provider: PaymentProvider;
  providerPaymentId: string;
  paymentUrl?: string;
}

export interface VerifyPaymentInput {
  providerPaymentId: string;
  referenceId: string;
  amount: string;
  currency: PaymentCurrency;

  /**
   * Optional transaction reference received from a trusted callback
   * and persisted only after server-side provider confirmation.
   */
  transactionId?: string;
}

export interface VerifyPaymentResult {
  providerPaymentId: string;
  transactionId?: string;
  amount: string;
  currency: PaymentCurrency;
}

export interface PaymentProviderInterface {
  readonly name: PaymentProvider;
  readonly supportedCurrencies: PaymentCurrency[];

  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  verifyPayment(input: VerifyPaymentInput): Promise<VerifyPaymentResult>;
}
