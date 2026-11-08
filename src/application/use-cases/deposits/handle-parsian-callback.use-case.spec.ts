import { HandleParsianCallbackUseCase } from "./handle-parsian-callback.use-case";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { VerifyDepositUseCase } from "./verify-deposit.use-case";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import {
  DepositNotFoundException,
  NotMatchException,
} from "@domain/exceptions/domain.exception";

describe("HandleParsianCallbackUseCase", () => {
  const depositRepository = { findByProviderOrderId: jest.fn() };
  const verifyDepositUseCase = { execute: jest.fn() };
  let useCase: HandleParsianCallbackUseCase;

  const deposit = {
    id: "deposit-1",
    userId: "user-1",
    provider: PaymentProvider.PARSIAN,
    currency: PaymentCurrency.IRT,
    status: DepositStatus.PENDING,
    providerPaymentId: "token-1",
    amount: "100",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    depositRepository.findByProviderOrderId.mockResolvedValue(deposit);
    verifyDepositUseCase.execute.mockResolvedValue({ id: "deposit-1" });
    useCase = new HandleParsianCallbackUseCase(
      depositRepository as unknown as DepositRepository,
      verifyDepositUseCase as unknown as VerifyDepositUseCase,
    );
  });

  it("validates the callback and delegates server-side verification", async () => {
    const result = await useCase.execute({
      OrderId: "12345",
      Token: "token-1",
      Amount: "1000",
      status: "0",
    });

    expect(depositRepository.findByProviderOrderId).toHaveBeenCalledWith(
      "12345",
    );
    expect(verifyDepositUseCase.execute).toHaveBeenCalledWith({
      userId: "user-1",
      depositId: "deposit-1",
    });
    expect(result).toEqual({ id: "deposit-1" });
  });

  it("rejects missing or invalid callback fields", async () => {
    await expect(
      useCase.execute({
        OrderId: "not-numeric",
        Token: "token",
        Amount: "1000",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);

    expect(depositRepository.findByProviderOrderId).not.toHaveBeenCalled();
  });

  it("throws when the deposit cannot be found", async () => {
    depositRepository.findByProviderOrderId.mockResolvedValue(null);

    await expect(
      useCase.execute({
        OrderId: "12345",
        Token: "token-1",
        Amount: "1000",
        status: "0",
      }),
    ).rejects.toBeInstanceOf(DepositNotFoundException);
  });

  it("rejects a deposit from another provider or currency", async () => {
    depositRepository.findByProviderOrderId.mockResolvedValue({
      ...deposit,
      provider: PaymentProvider.FAKE_PROVIDER,
    });

    await expect(
      useCase.execute({
        OrderId: "12345",
        Token: "token-1",
        Amount: "1000",
        status: "0",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);
  });

  it("returns an already completed deposit without verifying it again", async () => {
    const completed = { ...deposit, status: DepositStatus.COMPLETED };
    depositRepository.findByProviderOrderId.mockResolvedValue(completed);

    await expect(
      useCase.execute({
        OrderId: "12345",
        Token: "wrong-token",
        Amount: "wrong-amount",
        status: "1",
      }),
    ).resolves.toBe(completed);

    expect(verifyDepositUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects a mismatched provider token", async () => {
    await expect(
      useCase.execute({
        OrderId: "12345",
        Token: "wrong-token",
        Amount: "1000",
        status: "0",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);
  });

  it("rejects an unsuccessful provider callback", async () => {
    await expect(
      useCase.execute({
        OrderId: "12345",
        Token: "token-1",
        Amount: "1000",
        status: "1",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);

    expect(verifyDepositUseCase.execute).not.toHaveBeenCalled();
  });

  it("rejects an amount that does not match the deposit", async () => {
    await expect(
      useCase.execute({
        OrderId: "12345",
        Token: "token-1",
        Amount: "999",
        status: "0",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);
  });
});
