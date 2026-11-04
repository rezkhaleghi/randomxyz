import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("permit_settings")
export class PermitSettingOrmEntity {
  @PrimaryColumn({ type: "varchar", length: 32 })
  id!: string;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 0,
    default: "0",
  })
  defaultFee!: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
