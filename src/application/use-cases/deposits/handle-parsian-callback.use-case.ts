import { Injectable } from "@nestjs/common";

import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import {
  DepositNotFoundException,
  NotMatchException,
} from "@domain/exceptions/domain.exception";
import { DepositRepository } from "@domain/repositories/deposit.repository";

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
  ) {}

  async execute(input: ParsianCallbackInput) {
    const orderId = this.toStringValue(input.OrderId);
    const token = this.toStringValue(input.Token);
    const amount = this.toStringValue(input.Amount);
    const status = this.toStringValue(input.status);

    if (!orderId || !token || !amount) {
      throw new NotMatchException("Parsian callback fields", "Deposit");
    }

    const deposit = await this.depositRepository.findByReferenceId(orderId);

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

    // Callback success is not proof of settlement. Server-side confirmation is required.
    if (status !== "0") {
      throw new NotMatchException("Successful Parsian callback", "Deposit");
    }

    const expectedRialAmount = tomanToRialAmount(deposit.amount);

    if (
      !/^\d+$/.test(amount) ||
      BigInt(amount) !== BigInt(expectedRialAmount)
    ) {
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
