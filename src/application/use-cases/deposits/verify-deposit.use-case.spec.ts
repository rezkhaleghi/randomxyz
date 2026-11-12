import { VerifyDepositUseCase } from "./verify-deposit.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { Ledger } from "@domain/entities/ledger.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import {
  DepositNotFoundException,
  NotMatchException,
  UserBalanceNotFoundException,
} from "@domain/exceptions/domain.exception";

import { PaymentProviderResolver } from "@application/interfaces/payment-provider-resolver.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("VerifyDepositUseCase", () => {
  let useCase: VerifyDepositUseCase;

  const currency = Object.values(PaymentCurrency)[0] as PaymentCurrency;

  const paymentProviderMock = {
    verifyPayment: jest.fn(),
  };

  const paymentProviderResolverMock = {
    resolve: jest.fn().mockReturnValue(paymentProviderMock),
  };

  const depositRepositoryMock = {
    findByUserIdAndIdForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const userBalanceRepositoryMock = {
    findByUserIdAndCurrencyForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const ledgerRepositoryMock = {
    create: jest.fn(),
  };

  const auditLogRepositoryMock = {
    create: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    paymentProviderResolverMock.resolve.mockReturnValue(paymentProviderMock);

    useCase = new VerifyDepositUseCase(
      paymentProviderResolverMock as unknown as PaymentProviderResolver,
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  function setupFirstTransaction(deposit: Deposit | null) {
    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        depositRepository: depositRepositoryMock,
      }),
    );

    depositRepositoryMock.findByUserIdAndIdForUpdate.mockResolvedValue(deposit);
  }

  function setupSecondTransaction() {
    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        depositRepository: depositRepositoryMock,
        userBalanceRepository: userBalanceRepositoryMock,
        ledgerRepository: ledgerRepositoryMock,
        auditLogRepository: auditLogRepositoryMock,
      }),
    );
  }

  function createPendingDeposit(overrides: Partial<Deposit> = {}): Deposit {
    const deposit = Deposit.create({
      id: "deposit-1",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
      merchantOrderId: "merchant-order-1",
      providerPaymentId: "payment-1",
    });

    Object.assign(deposit, overrides);

    return deposit;
  }

  it("should return an already completed deposit without verifying it again", async () => {
    const deposit = createPendingDeposit();

    deposit.markCompleted("transaction-1");

    setupFirstTransaction(deposit);

    const result = await useCase.execute({
      userId: "user-1",
      depositId: "deposit-1",
    });

    expect(result).toBe(deposit);
    expect(paymentProviderResolverMock.resolve).not.toHaveBeenCalled();
    expect(paymentProviderMock.verifyPayment).not.toHaveBeenCalled();
  });

  it("should throw when the deposit does not exist", async () => {
    setupFirstTransaction(null);

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(DepositNotFoundException);

    expect(paymentProviderResolverMock.resolve).not.toHaveBeenCalled();
    expect(paymentProviderMock.verifyPayment).not.toHaveBeenCalled();
  });

  it("should throw when provider payment ID is missing", async () => {
    const deposit = createPendingDeposit({
      providerPaymentId: null,
    });

    setupFirstTransaction(deposit);

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(NotMatchException);

    expect(paymentProviderResolverMock.resolve).not.toHaveBeenCalled();
    expect(paymentProviderMock.verifyPayment).not.toHaveBeenCalled();
  });

  it("should verify payment and complete the deposit", async () => {
    const deposit = createPendingDeposit();
    const markCompletedSpy = jest.spyOn(deposit, "markCompleted");
    const providerResponse = { status: "verified" };

    const balance = UserBalance.create({
      userId: "user-1",
      currency,
      amount: "50",
    });

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockResolvedValue({
      transactionId: "transaction-1",
      providerResponse,
    });

    setupSecondTransaction();

    depositRepositoryMock.findByUserIdAndIdForUpdate.mockResolvedValue(deposit);

    userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );

    userBalanceRepositoryMock.save.mockImplementation(
      async (savedBalance: UserBalance) => savedBalance,
    );

    depositRepositoryMock.save.mockResolvedValue(deposit);

    ledgerRepositoryMock.create.mockImplementation(
      async (ledger: Ledger) => ledger,
    );

    auditLogRepositoryMock.create.mockImplementation(
      async (auditLog: AuditLog) => auditLog,
    );

    const result = await useCase.execute({
      userId: "user-1",
      depositId: "deposit-1",
    });

    expect(result).toBe(deposit);

    expect(paymentProviderResolverMock.resolve).toHaveBeenCalledWith(
      PaymentProvider.FAKE_PROVIDER,
    );

    expect(paymentProviderMock.verifyPayment).toHaveBeenCalledWith({
      merchantOrderId: deposit.merchantOrderId,
      providerPaymentId: "payment-1",
    });

    expect(
      userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate,
    ).toHaveBeenCalledWith("user-1", currency);

    expect(userBalanceRepositoryMock.save).toHaveBeenCalledWith(balance);
    expect(balance.amount).toBe("150");

    expect(ledgerRepositoryMock.create).toHaveBeenCalledTimes(1);

    const ledger = ledgerRepositoryMock.create.mock.calls[0][0];

    expect(ledger.userId).toBe("user-1");
    expect(ledger.currency).toBe(currency);
    expect(ledger.amount).toBe("100");
    expect(ledger.balanceBefore).toBe("50");
    expect(ledger.balanceAfter).toBe("150");
    expect(ledger.type).toBe(LedgerType.DEPOSIT);
    expect(ledger.referenceId).toBe(deposit.id);

    expect(markCompletedSpy).toHaveBeenCalledWith(
      "transaction-1",
      providerResponse,
    );

    expect(deposit.status).toBe(DepositStatus.COMPLETED);
    expect(deposit.transactionId).toBe("transaction-1");

    expect(depositRepositoryMock.save).toHaveBeenCalledWith(deposit);

    expect(auditLogRepositoryMock.create).toHaveBeenCalledTimes(1);

    expect(auditLogRepositoryMock.create.mock.calls[0][0].action).toBe(
      AuditAction.DEPOSIT_COMPLETED,
    );
  });

  it("should throw when provider verification fails", async () => {
    const deposit = createPendingDeposit();

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockRejectedValue(
      new Error("Payment verification failed"),
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toThrow("Payment verification failed");

    expect(
      userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(userBalanceRepositoryMock.save).not.toHaveBeenCalled();
    expect(ledgerRepositoryMock.create).not.toHaveBeenCalled();
    expect(depositRepositoryMock.save).not.toHaveBeenCalled();
    expect(auditLogRepositoryMock.create).not.toHaveBeenCalled();
  });

  it("should throw when the balance does not exist", async () => {
    const deposit = createPendingDeposit();

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockResolvedValue({
      transactionId: "transaction-1",
    });

    setupSecondTransaction();

    depositRepositoryMock.findByUserIdAndIdForUpdate.mockResolvedValue(deposit);

    userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      null,
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toBeInstanceOf(UserBalanceNotFoundException);

    expect(userBalanceRepositoryMock.save).not.toHaveBeenCalled();
    expect(ledgerRepositoryMock.create).not.toHaveBeenCalled();
    expect(depositRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("should not mutate the balance before provider verification succeeds", async () => {
    const deposit = createPendingDeposit();

    setupFirstTransaction(deposit);

    paymentProviderMock.verifyPayment.mockRejectedValue(
      new Error("Provider confirmation rejected"),
    );

    await expect(
      useCase.execute({
        userId: "user-1",
        depositId: "deposit-1",
      }),
    ).rejects.toThrow("Provider confirmation rejected");

    expect(
      userBalanceRepositoryMock.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();

    expect(userBalanceRepositoryMock.save).not.toHaveBeenCalled();
    expect(ledgerRepositoryMock.create).not.toHaveBeenCalled();
  });
});
