import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";

import { UserRole } from "@domain/enums/user-role.enum";
import { UserStatus } from "@domain/enums/user-status.enum";

@Entity("users")
@Index(["createdAt"])
@Index(["role"])
@Index(["tmarTravelRole"])
@Index(["status"])
@Index(["emailVerified"])
export class UserOrmEntity {
  @PrimaryColumn("uuid")
  id!: string;

  @Column({
    type: "varchar",
    nullable: true,
    unique: true,
  })
  externalUserId!: string | null;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true, type: "varchar" })
  firstName!: string | null;

  @Column({ nullable: true, type: "varchar" })
  lastName!: string | null;

  @Column({ nullable: true, unique: true, type: "varchar" })
  userName!: string | null;

  @Column({ nullable: true, type: "date" })
  dateOfBirth!: Date | null;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: UserRole;

  @Column({
    type: "varchar",
    default: UserRole.USER,
  })
  tmarTravelRole!: string;

  @Column({ default: false })
  emailVerified!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ nullable: true, type: "varchar" })
  bio!: string | null;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
  })
  status!: UserStatus;
}
