import { Deposit } from "./deposit.entity";
import { DepositStatus } from "../enums/deposit-status.enum";
import { PaymentCurrency } from "../enums/payment-currency.enum";
import {
  DepositCannotFailException,
  DepositChangeStatusNotAllowedException,
  InvalidDepositAmountException,
} from "../exceptions/domain.exception";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

describe("Deposit", () => {
  const createDeposit = () =>
    Deposit.create({
      userId: "user-1",
      currency: PaymentCurrency.USD,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
    });

  it("creates a pending deposit with generated identifiers", () => {
    const deposit = createDeposit();

    expect(deposit.id).toBeDefined();
    expect(deposit.merchantOrderId).toBeDefined();
    expect(deposit.userId).toBe("user-1");
    expect(deposit.currency).toBe(PaymentCurrency.USD);
    expect(deposit.amount).toBe("100");
    expect(deposit.status).toBe(DepositStatus.PENDING);
    expect(deposit.providerPaymentId).toBeNull();
    expect(deposit.transactionId).toBeNull();
    expect(deposit.completedAt).toBeNull();
  });

  it("sets the provider payment ID and URL", () => {
    const deposit = createDeposit();

    deposit.setProviderPayment("provider-payment-1", "https://payment.test");

    expect(deposit.providerPaymentId).toBe("provider-payment-1");
    expect(deposit.paymentUrl).toBe("https://payment.test");
  });

  it("completes a pending deposit", () => {
    const deposit = createDeposit();

    deposit.markCompleted("transaction-1");

    expect(deposit.status).toBe(DepositStatus.COMPLETED);
    expect(deposit.transactionId).toBe("transaction-1");
    expect(deposit.completedAt).toBeInstanceOf(Date);
  });

  it("keeps the existing transaction ID when no transaction ID is provided", () => {
    const deposit = Deposit.create({
      userId: "user-1",
      currency: PaymentCurrency.USD,
      amount: "100",
      transactionId: "transaction-1",
      provider: PaymentProvider.FAKE_PROVIDER,
    });

    deposit.markCompleted();

    expect(deposit.status).toBe(DepositStatus.COMPLETED);
    expect(deposit.transactionId).toBe("transaction-1");
  });

  it("rejects completing a non-pending deposit", () => {
    const deposit = createDeposit();

    deposit.markCompleted();

    expect(() => deposit.markCompleted()).toThrow(
      DepositChangeStatusNotAllowedException,
    );
  });

  it("marks a pending deposit as failed", () => {
    const deposit = createDeposit();

    deposit.markFailed();

    expect(deposit.status).toBe(DepositStatus.FAILED);
  });

  it("rejects failing a non-pending deposit", () => {
    const deposit = createDeposit();

    deposit.markCompleted();

    expect(() => deposit.markFailed()).toThrow(DepositCannotFailException);
  });

  it("rejects a zero amount", () => {
    expect(() =>
      Deposit.create({
        userId: "user-1",
        currency: PaymentCurrency.USD,
        amount: "0",
        provider: PaymentProvider.FAKE_PROVIDER,
      }),
    ).toThrow(InvalidDepositAmountException);
  });

  it("rejects a negative amount", () => {
    expect(() =>
      Deposit.create({
        userId: "user-1",
        currency: PaymentCurrency.USD,
        amount: "-10",
        provider: PaymentProvider.FAKE_PROVIDER,
      }),
    ).toThrow(InvalidDepositAmountException);
  });
});
