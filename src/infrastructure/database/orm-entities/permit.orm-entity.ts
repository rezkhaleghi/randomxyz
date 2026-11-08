import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PermitStatus } from "@domain/enums/permit-status.enum";

import { UserOrmEntity } from "./user.orm-entity";
import { LocationOrmEntity } from "./location.orm-entity";

@Entity("permits")
@Index(["userId", "createdAt"])
@Index(["locationId", "startDate", "endDate"])
@Index(["qrToken"], { unique: true })
export class PermitOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

  @Column({ type: "uuid" })
  locationId!: string;

  @ManyToOne(() => LocationOrmEntity, {
    nullable: false,
    onDelete: "RESTRICT",
  })
  @JoinColumn({ name: "locationId" })
  location!: LocationOrmEntity;

  @Column({ type: "date" })
  startDate!: string;

  @Column({ type: "date" })
  endDate!: string;

  @Column({
    type: "enum",
    enum: PermitStatus,
    default: PermitStatus.CONFIRMED,
  })
  status!: PermitStatus;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 0,
  })
  totalAmount!: string;

  @Column({
    type: "enum",
    enum: PaymentCurrency,
  })
  currency!: PaymentCurrency;

  @Column({ type: "varchar", length: 128 })
  qrToken!: string;

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  passengers!: {
    id: string | null;
    fullName: string;
    nationalId: string;
    isLeader: boolean;
  }[];

  @Column({ type: "jsonb", default: () => "'[]'::jsonb" })
  vehicles!: {
    id: string | null;
    kind: string;
    color: string;
    plateId: string;
  }[];

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
