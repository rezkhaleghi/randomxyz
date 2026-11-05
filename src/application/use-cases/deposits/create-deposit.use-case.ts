import { Inject, Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import {
  DepositIdempotencyConflictException,
  DepositNotFoundException,
  InvalidDepositAmountException,
  UnsupportedPaymentCurrencyException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";
import {
  PaymentProviderResolver,
  PAYMENT_PROVIDER_RESOLVER,
} from "@application/interfaces/payment-provider-resolver.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { isNegativeDecimal, isZeroDecimal } from "@domain/utils/decimal.util";

export interface CreateDepositInput {
  userId: string;
  provider: PaymentProvider;
  currency: PaymentCurrency;
  amount: string;
  idempotencyKey: string;
  callbackUrl: string;
}

@Injectable()
export class CreateDepositUseCase {
  constructor(
    @Inject(PAYMENT_PROVIDER_RESOLVER)
    private readonly paymentProviderResolver: PaymentProviderResolver,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: CreateDepositInput): Promise<Deposit> {
    const paymentProvider = this.paymentProviderResolver.resolve(
      input.provider,
    );

    if (!paymentProvider.supportedCurrencies.includes(input.currency)) {
      throw new UnsupportedPaymentCurrencyException(input.currency);
    }

    if (isNegativeDecimal(input.amount) || isZeroDecimal(input.amount)) {
      throw new InvalidDepositAmountException();
    }

    const deposit = await this.unitOfWork.execute(
      async ({ userRepository, depositRepository }) => {
        const user = await userRepository.findById(input.userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        await depositRepository.lockByUserIdAndIdempotencyKey(
          input.userId,
          input.idempotencyKey,
        );

        const existing = await depositRepository.findByUserIdAndIdempotencyKey(
          input.userId,
          input.idempotencyKey,
        );

        if (existing) {
          this.assertSameIdempotentRequest(existing, input);
          return existing;
        }

        const newDeposit = Deposit.create({
          userId: input.userId,
          provider: input.provider,
          currency: input.currency,
          amount: input.amount,
          status: DepositStatus.PENDING,
          idempotencyKey: input.idempotencyKey,
        });

        const created = await depositRepository.create(newDeposit);

        this.assertSameIdempotentRequest(created, input);

        return created;
      },
    );

    if (deposit.providerPaymentId) {
      return deposit;
    }

    return this.unitOfWork.execute(async ({ depositRepository }) => {
      await depositRepository.lockByUserIdAndIdempotencyKey(
        input.userId,
        input.idempotencyKey,
      );

      const currentDeposit = await depositRepository.findByIdForUpdate(
        deposit.id,
      );

      if (!currentDeposit) {
        throw new DepositNotFoundException();
      }

      this.assertSameIdempotentRequest(currentDeposit, input);

      if (currentDeposit.providerPaymentId) {
        return currentDeposit;
      }

      const payment = await paymentProvider.createPayment({
        amount: currentDeposit.amount,
        currency: currentDeposit.currency,
        referenceId: currentDeposit.referenceId,
        callbackUrl: input.callbackUrl,
      });

      if (!payment.providerPaymentId) {
        throw new Error(
          "Payment provider did not return a payment identifier.",
        );
      }

      currentDeposit.setProviderPayment(
        payment.providerPaymentId,
        payment.paymentUrl,
      );

      return depositRepository.save(currentDeposit);
    });
  }

  private assertSameIdempotentRequest(
    existing: Deposit,
    input: CreateDepositInput,
  ): void {
    const sameRequest =
      existing.provider === input.provider &&
      existing.currency === input.currency &&
      existing.amount === input.amount &&
      existing.idempotencyKey === input.idempotencyKey;

    if (!sameRequest) {
      throw new DepositIdempotencyConflictException();
    }
  }
}
