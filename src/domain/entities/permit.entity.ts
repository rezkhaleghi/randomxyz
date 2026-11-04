import { randomUUID } from "crypto";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PermitStatus } from "@domain/enums/permit-status.enum";

export interface CreatePermitProps {
  id?: string;
  userId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  totalAmount: string;
  currency: PaymentCurrency;
  qrToken: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RestorePermitProps {
  id: string;
  userId: string;
  locationId: string;
  startDate: string;
  endDate: string;
  status: PermitStatus;
  totalAmount: string;
  currency: PaymentCurrency;
  qrToken: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Permit {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly locationId: string,
    public readonly startDate: string,
    public readonly endDate: string,
    public status: PermitStatus,
    public totalAmount: string,
    public readonly currency: PaymentCurrency,
    public readonly qrToken: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: CreatePermitProps): Permit {
    const now = new Date();

    return new Permit(
      props.id ?? randomUUID(),
      props.userId,
      props.locationId,
      props.startDate,
      props.endDate,
      PermitStatus.CONFIRMED,
      props.totalAmount,
      props.currency,
      props.qrToken,
      props.createdAt ?? now,
      props.updatedAt ?? now,
    );
  }

  static restore(props: RestorePermitProps): Permit {
    return new Permit(
      props.id,
      props.userId,
      props.locationId,
      props.startDate,
      props.endDate,
      props.status,
      props.totalAmount,
      props.currency,
      props.qrToken,
      props.createdAt,
      props.updatedAt,
    );
  }

  updateTotalAmount(totalAmount: string): void {
    this.totalAmount = totalAmount;
    this.updatedAt = new Date();
  }

  end(): void {
    this.status = PermitStatus.ENDED;
    this.updatedAt = new Date();
  }

  revoke(): void {
    this.status = PermitStatus.REVOKED;
    this.updatedAt = new Date();
  }

  expire(): void {
    this.status = PermitStatus.EXPIRED;
    this.updatedAt = new Date();
  }
}
