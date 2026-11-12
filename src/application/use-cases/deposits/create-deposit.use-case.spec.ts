import { CreateDepositUseCase } from "./create-deposit.use-case";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";

import {
  InvalidDepositAmountException,
  UnsupportedPaymentCurrencyException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PaymentProviderResolver } from "@application/interfaces/payment-provider-resolver.interface";

describe("CreateDepositUseCase", () => {
  let useCase: CreateDepositUseCase;

  const currency = Object.values(PaymentCurrency)[0] as PaymentCurrency;

  const paymentProviderMock = {
    name: PaymentProvider.FAKE_PROVIDER,
    supportedCurrencies: [currency],
    createPayment: jest.fn(),
    verifyPayment: jest.fn(),
  };

  const paymentProviderResolverMock = {
    resolve: jest.fn().mockReturnValue(paymentProviderMock),
  };

  const userRepositoryMock = {
    findById: jest.fn(),
  };

  const depositRepositoryMock = {
    create: jest.fn(),
    findByIdForUpdate: jest.fn(),
    save: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    paymentProviderResolverMock.resolve.mockReturnValue(paymentProviderMock);

    useCase = new CreateDepositUseCase(
      paymentProviderResolverMock as unknown as PaymentProviderResolver,
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  const createInput = (
    overrides: Partial<{
      userId: string;
      currency: PaymentCurrency;
      amount: string;
      provider: PaymentProvider;
      callbackUrl: string;
    }> = {},
  ) => ({
    userId: "user-1",
    currency,
    amount: "100",
    provider: PaymentProvider.FAKE_PROVIDER,
    callbackUrl: "https://backend.test/deposits/parsian/callback",
    ...overrides,
  });

  it("creates a new deposit and attaches the provider payment details", async () => {
    const createdDeposit = Deposit.create({
      id: "deposit-1",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
    });

    const savedDeposit = Deposit.restore({
      id: createdDeposit.id,
      userId: createdDeposit.userId,
      currency: createdDeposit.currency,
      amount: createdDeposit.amount,
      provider: createdDeposit.provider,
      status: createdDeposit.status,
      merchantOrderId: createdDeposit.merchantOrderId,
      providerPaymentId: "payment-123",
      paymentUrl: "https://payment.test",
      transactionId: null,
      providerResponse: null,
      createdAt: createdDeposit.createdAt,
      updatedAt: new Date(),
      completedAt: null,
    });

    userRepositoryMock.findById.mockResolvedValue({ id: "user-1" });
    depositRepositoryMock.create.mockResolvedValue(createdDeposit);
    depositRepositoryMock.findByIdForUpdate.mockResolvedValue(createdDeposit);
    depositRepositoryMock.save.mockResolvedValue(savedDeposit);

    paymentProviderMock.createPayment.mockResolvedValue({
      providerPaymentId: "payment-123",
      paymentUrl: "https://payment.test",
    });

    unitOfWorkMock.execute
      .mockImplementationOnce(async (callback: any) =>
        callback({
          userRepository: userRepositoryMock,
          depositRepository: depositRepositoryMock,
        }),
      )
      .mockImplementationOnce(async (callback: any) =>
        callback({
          depositRepository: depositRepositoryMock,
        }),
      );

    const result = await useCase.execute(createInput());

    expect(result).toBe(savedDeposit);

    expect(paymentProviderResolverMock.resolve).toHaveBeenCalledWith(
      PaymentProvider.FAKE_PROVIDER,
    );

    expect(userRepositoryMock.findById).toHaveBeenCalledWith("user-1");
    expect(depositRepositoryMock.create).toHaveBeenCalledTimes(1);

    const depositArgument = depositRepositoryMock.create.mock.calls[0][0];

    expect(depositArgument.userId).toBe("user-1");
    expect(depositArgument.currency).toBe(currency);
    expect(depositArgument.amount).toBe("100");
    expect(depositArgument.provider).toBe(PaymentProvider.FAKE_PROVIDER);
    expect(depositArgument.status).toBe(DepositStatus.PENDING);
    expect(depositArgument.merchantOrderId).toBeDefined();

    expect(paymentProviderMock.createPayment).toHaveBeenCalledWith({
      amount: "100",
      currency,
      merchantOrderId: createdDeposit.merchantOrderId,
      callbackUrl: "https://backend.test/deposits/parsian/callback",
    });

    expect(depositRepositoryMock.findByIdForUpdate).toHaveBeenCalledWith(
      "deposit-1",
    );

    expect(depositRepositoryMock.save).toHaveBeenCalledWith(createdDeposit);
  });

  it("creates a separate deposit and merchant order ID for every new request", async () => {
    const firstDeposit = Deposit.create({
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
    });

    const secondDeposit = Deposit.create({
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
    });

    expect(firstDeposit.id).not.toBe(secondDeposit.id);
    expect(firstDeposit.merchantOrderId).not.toBe(
      secondDeposit.merchantOrderId,
    );
  });

  it("throws when the currency is not supported", async () => {
    const unsupportedCurrency = Object.values(PaymentCurrency).find(
      (value) => value !== currency,
    );

    if (unsupportedCurrency === undefined) {
      throw new Error(
        "PaymentCurrency must contain at least two currencies for this test",
      );
    }

    await expect(
      useCase.execute(
        createInput({
          currency: unsupportedCurrency,
        }),
      ),
    ).rejects.toBeInstanceOf(UnsupportedPaymentCurrencyException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("throws when the amount is zero", async () => {
    await expect(
      useCase.execute(createInput({ amount: "0" })),
    ).rejects.toBeInstanceOf(InvalidDepositAmountException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
  });

  it("throws when the amount is negative", async () => {
    await expect(
      useCase.execute(createInput({ amount: "-10" })),
    ).rejects.toBeInstanceOf(InvalidDepositAmountException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
  });

  it("throws when the user does not exist", async () => {
    userRepositoryMock.findById.mockResolvedValue(null);

    unitOfWorkMock.execute.mockImplementation(async (callback: any) =>
      callback({
        userRepository: userRepositoryMock,
        depositRepository: depositRepositoryMock,
      }),
    );

    await expect(useCase.execute(createInput())).rejects.toBeInstanceOf(
      UserNotFoundException,
    );

    expect(userRepositoryMock.findById).toHaveBeenCalledWith("user-1");
    expect(depositRepositoryMock.create).not.toHaveBeenCalled();
    expect(paymentProviderMock.createPayment).not.toHaveBeenCalled();
  });

  it("does not save payment details if the provider initialization fails", async () => {
    const deposit = Deposit.create({
      id: "deposit-1",
      userId: "user-1",
      currency,
      amount: "100",
      provider: PaymentProvider.FAKE_PROVIDER,
    });

    userRepositoryMock.findById.mockResolvedValue({ id: "user-1" });
    depositRepositoryMock.create.mockResolvedValue(deposit);

    unitOfWorkMock.execute.mockImplementationOnce(async (callback: any) =>
      callback({
        userRepository: userRepositoryMock,
        depositRepository: depositRepositoryMock,
      }),
    );

    paymentProviderMock.createPayment.mockRejectedValue(
      new Error("Payment provider unavailable"),
    );

    await expect(useCase.execute(createInput())).rejects.toThrow(
      "Payment provider unavailable",
    );

    expect(depositRepositoryMock.save).not.toHaveBeenCalled();
  });
});
