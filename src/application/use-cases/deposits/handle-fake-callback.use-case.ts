import { Injectable } from "@nestjs/common";

import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentProvider } from "@domain/enums/payment-provider.enum";
import {
  DepositNotFoundException,
  NotMatchException,
} from "@domain/exceptions/domain.exception";
import { DepositRepository } from "@domain/repositories/deposit.repository";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { VerifyDepositUseCase } from "./verify-deposit.use-case";

export interface FakeCallbackInput {
  referenceId?: unknown;
  providerPaymentId?: unknown;
  status?: unknown;
}

@Injectable()
export class HandleFakeCallbackUseCase {
  constructor(
    private readonly depositRepository: DepositRepository,
    private readonly verifyDepositUseCase: VerifyDepositUseCase,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: FakeCallbackInput) {
    const referenceId = this.toStringValue(input.referenceId);
    const providerPaymentId = this.toStringValue(input.providerPaymentId);
    const status = this.toStringValue(input.status);

    if (!referenceId || !providerPaymentId || !status) {
      throw new NotMatchException("Fake callback fields", "Deposit");
    }

    const deposit = await this.depositRepository.findByReferenceId(referenceId);

    if (!deposit) {
      throw new DepositNotFoundException();
    }

    if (
      deposit.provider !== PaymentProvider.FAKE_PROVIDER ||
      deposit.providerPaymentId !== providerPaymentId
    ) {
      throw new NotMatchException("Fake payment", "Deposit");
    }

    if (deposit.status === DepositStatus.COMPLETED) {
      return deposit;
    }

    // Status "0" means Complete. Any other status means Cancel.
    if (status === "0") {
      if (deposit.status !== DepositStatus.PENDING) {
        throw new NotMatchException("Pending fake deposit", "Deposit");
      }

      return this.verifyDepositUseCase.execute({
        userId: deposit.userId,
        depositId: deposit.id,
      });
    }

    return this.unitOfWork.execute(async ({ depositRepository }) => {
      const currentDeposit = await depositRepository.findByIdForUpdate(
        deposit.id,
      );

      if (!currentDeposit) {
        throw new DepositNotFoundException();
      }

      if (currentDeposit.status !== DepositStatus.PENDING) {
        return currentDeposit;
      }

      currentDeposit.markFailed();

      return depositRepository.save(currentDeposit);
    });
  }

  private toStringValue(value: unknown): string {
    if (typeof value === "string" || typeof value === "number") {
      return String(value).trim();
    }

    return "";
  }
}
