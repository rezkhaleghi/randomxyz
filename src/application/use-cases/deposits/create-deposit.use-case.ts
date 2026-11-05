import { Inject, Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import {
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

        const newDeposit = Deposit.create({
          userId: input.userId,
          provider: input.provider,
          currency: input.currency,
          amount: input.amount,
          status: DepositStatus.PENDING,
        });

        return depositRepository.create(newDeposit);
      },
    );

    const payment = await paymentProvider.createPayment({
      amount: deposit.amount,
      currency: deposit.currency,
      referenceId: deposit.referenceId,
      providerOrderId: deposit.providerOrderId,
      callbackUrl: input.callbackUrl,
    });

    if (!payment.providerPaymentId) {
      throw new Error("Payment provider did not return a payment identifier.");
    }

    return this.unitOfWork.execute(async ({ depositRepository }) => {
      const currentDeposit = await depositRepository.findByIdForUpdate(
        deposit.id,
      );

      if (!currentDeposit) {
        throw new DepositNotFoundException();
      }

      currentDeposit.setProviderPayment(
        payment.providerPaymentId,
        payment.paymentUrl,
      );

      return depositRepository.save(currentDeposit);
    });
  }
}
