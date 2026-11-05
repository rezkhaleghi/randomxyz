import { randomInt, randomUUID } from "crypto";

import { PaymentCurrency } from "../enums/payment-currency.enum";
import { PaymentProvider } from "../enums/payment-provider.enum";
import { DepositStatus } from "../enums/deposit-status.enum";

import {
  DepositCannotFailException,
  DepositChangeStatusNotAllowedException,
  InvalidDepositAmountException,
} from "@domain/exceptions/domain.exception";

import { isNegativeDecimal, isZeroDecimal } from "../utils/decimal.util";

export interface CreateDepositProps {
  id?: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  provider: PaymentProvider;
  providerOrderId?: string | null;
  status?: DepositStatus;
  referenceId?: string;
  providerPaymentId?: string | null;
  paymentUrl?: string | null;
  transactionId?: string | null;
  completedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestoreDepositProps {
  id: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
  provider: PaymentProvider;
  status: DepositStatus;
  referenceId: string;
  providerOrderId?: string | null;
  providerPaymentId: string | null;
  paymentUrl?: string | null;
  transactionId: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export class Deposit {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly currency: PaymentCurrency,
    public readonly amount: string,
    public readonly provider: PaymentProvider,
    public status: DepositStatus,
    public readonly referenceId: string,
    public readonly providerOrderId: string | null,
    public providerPaymentId: string | null,
    public paymentUrl: string | null,
    public transactionId: string | null,
    public readonly createdAt: Date,
    public updatedAt: Date,
    public completedAt: Date | null,
  ) {}

  static create(props: CreateDepositProps): Deposit {
    if (isNegativeDecimal(props.amount) || isZeroDecimal(props.amount)) {
      throw new InvalidDepositAmountException();
    }

    const providerOrderId =
      props.providerOrderId ??
      (props.provider === PaymentProvider.PARSIAN
        ? randomInt(1_000_000, 2_147_483_647).toString()
        : null);

    const now = new Date();

    return new Deposit(
      props.id ?? randomUUID(),
      props.userId,
      props.currency,
      props.amount,
      props.provider,
      props.status ?? DepositStatus.PENDING,
      props.referenceId ?? randomUUID(),
      providerOrderId,
      props.providerPaymentId ?? null,
      props.paymentUrl ?? null,
      props.transactionId ?? null,
      props.createdAt ?? now,
      props.updatedAt ?? now,
      props.completedAt ?? null,
    );
  }

  static restore(props: RestoreDepositProps): Deposit {
    return new Deposit(
      props.id,
      props.userId,
      props.currency,
      props.amount,
      props.provider,
      props.status,
      props.referenceId,
      props.providerOrderId ?? null,
      props.providerPaymentId,
      props.paymentUrl ?? null,
      props.transactionId,
      props.createdAt,
      props.updatedAt,
      props.completedAt,
    );
  }

  setProviderPayment(providerPaymentId: string, paymentUrl?: string): void {
    this.providerPaymentId = providerPaymentId;
    this.paymentUrl = paymentUrl ?? null;
    this.updatedAt = new Date();
  }

  markCompleted(transactionId?: string): void {
    if (this.status !== DepositStatus.PENDING) {
      throw new DepositChangeStatusNotAllowedException(this.status);
    }

    this.status = DepositStatus.COMPLETED;
    this.transactionId = transactionId ?? this.transactionId;
    this.completedAt = new Date();
    this.updatedAt = new Date();
  }

  markFailed(): void {
    if (this.status !== DepositStatus.PENDING) {
      throw new DepositCannotFailException(this.status);
    }

    this.status = DepositStatus.FAILED;
    this.updatedAt = new Date();
  }
}
