import { Injectable } from "@nestjs/common";

import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import {
  DepositNotFoundException,
  NotMatchException,
} from "@domain/exceptions/domain.exception";
import { DepositRepository } from "@domain/repositories/deposit.repository";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { VerifyDepositUseCase } from "./verify-deposit.use-case";
import { tomanToRialAmount } from "@domain/utils/decimal.util";

export interface ParsianCallbackInput {
  OrderId?: unknown;
  Token?: unknown;
  Amount?: unknown;
  status?: unknown;
}

@Injectable()
export class HandleParsianCallbackUseCase {
  constructor(
    private readonly depositRepository: DepositRepository,
    private readonly verifyDepositUseCase: VerifyDepositUseCase,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: ParsianCallbackInput) {
    const orderId = this.toStringValue(input.OrderId);
    const token = this.toStringValue(input.Token);
    const amount = this.toStringValue(input.Amount);
    const status = this.toStringValue(input.status);

    if (!orderId || !/^\d+$/.test(orderId) || !token || !status) {
      throw new NotMatchException("Parsian callback fields", "Deposit");
    }

    const deposit = await this.depositRepository.findByMerchantOrderId(orderId);

    if (!deposit) {
      throw new DepositNotFoundException();
    }

    if (
      deposit.provider !== PaymentProvider.PARSIAN ||
      deposit.currency !== PaymentCurrency.IRT
    ) {
      throw new NotMatchException("Parsian payment", "Deposit");
    }

    if (deposit.status === DepositStatus.COMPLETED) {
      return deposit;
    }

    if (!deposit.providerPaymentId || deposit.providerPaymentId !== token) {
      throw new NotMatchException("Parsian token", "Deposit");
    }

    // A non-zero Parsian status means the payment was not successful.
    if (status !== "0") {
      return this.unitOfWork.execute(async ({ depositRepository }) => {
        const currentDeposit = await depositRepository.findByIdForUpdate(
          deposit.id,
        );

        if (!currentDeposit) {
          throw new DepositNotFoundException();
        }

        // Do not change an already completed or failed deposit.
        if (currentDeposit.status !== DepositStatus.PENDING) {
          return currentDeposit;
        }

        currentDeposit.markFailed();

        return depositRepository.save(currentDeposit);
      });
    }

    if (!amount || !/^\d+$/.test(amount)) {
      throw new NotMatchException("Parsian payment amount", "Deposit");
    }

    const expectedRialAmount = tomanToRialAmount(deposit.amount);

    if (BigInt(amount) !== BigInt(expectedRialAmount)) {
      throw new NotMatchException("Parsian payment amount", "Deposit");
    }

    return this.verifyDepositUseCase.execute({
      userId: deposit.userId,
      depositId: deposit.id,
    });
  }

  private toStringValue(value: unknown): string {
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    return "";
  }
}
