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

import { UserOrmEntity } from "./user.orm-entity";

@Entity("vehicles")
@Index(["userId", "kind", "color", "plateId"], { unique: true })
@Index(["userId", "createdAt"])
export class VehicleOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  userId!: string;

  @ManyToOne(() => UserOrmEntity, {
    nullable: false,
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "userId" })
  user!: UserOrmEntity;

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
