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

  // Availability comes from Tmar-Travel.
  @Column({ type: "boolean", default: true })
  isAvailable!: boolean;

  // Enablement belongs to Tmar-Cert and must survive synchronization.
  @Column({ type: "boolean", default: true })
  isEnabled!: boolean;

  @CreateDateColumn({ type: "timestamp" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt!: Date;
}
