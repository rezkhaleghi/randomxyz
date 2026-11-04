import "dotenv/config";

import { DataSource } from "typeorm";

import { UserOrmEntity } from "../database/orm-entities/user.orm-entity";
import { AuditLogOrmEntity } from "../database/orm-entities/audit-log.orm-entity";
import { UserBalanceOrmEntity } from "../database/orm-entities/user-balance.orm-entity";
import { LedgerOrmEntity } from "../database/orm-entities/ledger.orm-entity";
import { DepositOrmEntity } from "../database/orm-entities/deposit.orm-entity";
import { WithdrawalOrmEntity } from "../database/orm-entities/withdrawal.orm-entity";
import { NotificationOrmEntity } from "@infrastructure/database/orm-entities/notification.orm-entity";
import { PageOrmEntity } from "@infrastructure/database/orm-entities/page.orm-entity";
import { LocationOrmEntity } from "@infrastructure/database/orm-entities/location.orm-entity";
import { PermitSettingOrmEntity } from "@infrastructure/database/orm-entities/permit-setting.orm-entity";
import { LocationDateOverrideOrmEntity } from "@infrastructure/database/orm-entities/location-date-override.orm-entity";
import { PermitOrmEntity } from "@infrastructure/database/orm-entities/permit.orm-entity";
import { PassengerOrmEntity } from "@infrastructure/database/orm-entities/passenger.orm-entity";
import { VehicleOrmEntity } from "@infrastructure/database/orm-entities/vehicle.orm-entity";

/**
 * TypeORM CLI data source configuration.
 *
 * This file is used by the TypeORM CLI for database operations
 * such as generating, running, and reverting migrations.
 *
 * It is separate from NestJS configuration because the TypeORM CLI
 * runs independently of the NestJS application and dependency injection.
 */
export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [
    UserOrmEntity,
    AuditLogOrmEntity,
    UserBalanceOrmEntity,
    LedgerOrmEntity,
    DepositOrmEntity,
    WithdrawalOrmEntity,
    NotificationOrmEntity,
    PageOrmEntity,
    LocationOrmEntity,
    PermitSettingOrmEntity,
    LocationDateOverrideOrmEntity,
    PermitOrmEntity,
    PassengerOrmEntity,
    VehicleOrmEntity,
  ],
  migrations: [__dirname + "/../database/migrations/*.{js,ts}"],
  synchronize: true, // Set to false in production to avoid data loss
});

//                     Database
//                        │
//           ┌────────────┴────────────┐
//           │                         │
//       NestJS app                TypeORM CLI
//           │                         │
//           ▼                         ▼
// typeorm-config.ts             data-source.ts
//           │                         │
//           ▼                         ▼
//    TypeOrmModule              DataSource
