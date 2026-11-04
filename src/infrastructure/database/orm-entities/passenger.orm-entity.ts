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

import { PermitOrmEntity } from "./permit.orm-entity";

@Entity("passengers")
@Index(["permitId", "nationalId"], { unique: true })
export class PassengerOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  permitId!: string;

  @ManyToOne(() => PermitOrmEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "permitId" })
  permit!: PermitOrmEntity;

  @Column({ type: "varchar", length: 255 })
  fullName!: string;

  @Column({ type: "varchar", length: 32 })
  nationalId!: string;

  @Column({ type: "boolean", default: false })
  isLeader!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
