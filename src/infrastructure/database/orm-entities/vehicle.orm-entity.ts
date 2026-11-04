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

@Entity("vehicles")
@Index(["permitId", "plateId"], { unique: true })
export class VehicleOrmEntity {
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

  @Column({ type: "varchar", length: 100 })
  kind!: string;

  @Column({ type: "varchar", length: 100 })
  color!: string;

  @Column({ type: "varchar", length: 32 })
  plateId!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
