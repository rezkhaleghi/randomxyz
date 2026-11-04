import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("locations")
@Index("UQ_locations_external_id", ["externalId"], { unique: true })
@Index("IDX_locations_availability", ["isAvailable", "isEnabled"])
export class LocationOrmEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 64 })
  externalId!: string;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  slug!: string;

  @Column({ type: "varchar", length: 120 })
  province!: string;

  @Column({ type: "varchar", length: 120 })
  city!: string;

  @Column({ type: "varchar", length: 32 })
  x!: string;

  @Column({ type: "varchar", length: 32 })
  y!: string;

  // Availability is controlled by Tmar-Travel.
  @Column({ type: "boolean", default: true })
  isAvailable!: boolean;

  // Enablement is controlled by Tmar-Cert.
  @Column({ type: "boolean", default: true })
  isEnabled!: boolean;

  // Zero means the location has not yet been configured
  // for permit reservations.
  @Column({ type: "integer", default: 0 })
  capacity!: number;

  // Null means use the global default permit fee.
  // PostgreSQL numeric values are returned as strings.
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
