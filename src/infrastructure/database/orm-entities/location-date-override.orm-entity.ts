import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { LocationOrmEntity } from "./location.orm-entity";

@Entity("location_date_overrides")
@Index("UQ_location_date_overrides_location_date", ["locationId", "date"], {
  unique: true,
})
@Index("IDX_location_date_overrides_date", ["date"])
export class LocationDateOverrideOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid" })
  locationId!: string;

  @ManyToOne(() => LocationOrmEntity, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "locationId" })
  location!: LocationOrmEntity;

  @Column({ type: "date" })
  date!: string;

  @Column({ type: "integer", nullable: true })
  capacity!: number | null;

  @Column({
    type: "numeric",
    precision: 20,
    scale: 0,
    nullable: true,
  })
  fee!: string | null;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
