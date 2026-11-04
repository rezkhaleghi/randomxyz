import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  UnitOfWork,
  UnitOfWorkRepositories,
} from "@application/interfaces/unit-of-work.interface";

import { UserRepositoryImpl } from "./repositories/user.repository.impl";
import { UserBalanceRepositoryImpl } from "./repositories/user-balance.repository.impl";
import { AuditLogRepositoryImpl } from "./repositories/audit-log.repository.impl";
import { LedgerRepositoryImpl } from "./repositories/ledger.repository.impl";
import { DepositRepositoryImpl } from "./repositories/deposit.repository.impl";
import { WithdrawalRepositoryImpl } from "./repositories/withdrawal.repository.impl";
import { NotificationRepositoryImpl } from "./repositories/notification.repository.impl";
import { PageRepositoryImpl } from "./repositories/page.repository.impl";
import { LocationRepositoryImpl } from "./repositories/location.repository.impl";
import { LocationDateOverrideRepositoryImpl } from "./repositories/location-date-override.repository.impl";
import { PermitSettingsRepositoryImpl } from "./repositories/permit-setting.repository.impl";
import { PermitRepositoryImpl } from "./repositories/permit.repository.impl";
import { PassengerRepositoryImpl } from "./repositories/passenger.repository.impl";
import { VehicleRepositoryImpl } from "./repositories/vehicle.repository.impl";

import { UserOrmEntity } from "./orm-entities/user.orm-entity";
import { UserBalanceOrmEntity } from "./orm-entities/user-balance.orm-entity";
import { AuditLogOrmEntity } from "./orm-entities/audit-log.orm-entity";
import { LedgerOrmEntity } from "./orm-entities/ledger.orm-entity";
import { DepositOrmEntity } from "./orm-entities/deposit.orm-entity";
import { WithdrawalOrmEntity } from "./orm-entities/withdrawal.orm-entity";
import { NotificationOrmEntity } from "./orm-entities/notification.orm-entity";
import { PageOrmEntity } from "./orm-entities/page.orm-entity";
import { LocationOrmEntity } from "./orm-entities/location.orm-entity";
import { LocationDateOverrideOrmEntity } from "./orm-entities/location-date-override.orm-entity";
import { PermitSettingOrmEntity } from "./orm-entities/permit-setting.orm-entity";
import { PermitOrmEntity } from "./orm-entities/permit.orm-entity";
import { PassengerOrmEntity } from "./orm-entities/passenger.orm-entity";
import { VehicleOrmEntity } from "./orm-entities/vehicle.orm-entity";

@Injectable()
export class TypeOrmUnitOfWork implements UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  async execute<T>(
    work: (repositories: UnitOfWorkRepositories) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction(async (manager) => {
      const repositories: UnitOfWorkRepositories = {
        userRepository: new UserRepositoryImpl(
          manager.getRepository(UserOrmEntity),
        ),
        userBalanceRepository: new UserBalanceRepositoryImpl(
          manager.getRepository(UserBalanceOrmEntity),
        ),
        auditLogRepository: new AuditLogRepositoryImpl(
          manager.getRepository(AuditLogOrmEntity),
        ),
        ledgerRepository: new LedgerRepositoryImpl(
          manager.getRepository(LedgerOrmEntity),
        ),
        depositRepository: new DepositRepositoryImpl(
          manager.getRepository(DepositOrmEntity),
        ),
        withdrawalRepository: new WithdrawalRepositoryImpl(
          manager.getRepository(WithdrawalOrmEntity),
        ),
        notificationRepository: new NotificationRepositoryImpl(
          manager.getRepository(NotificationOrmEntity),
        ),
        pageRepository: new PageRepositoryImpl(
          manager.getRepository(PageOrmEntity),
        ),
        locationRepository: new LocationRepositoryImpl(
          manager.getRepository(LocationOrmEntity),
          this.dataSource,
        ),
        locationDateOverrideRepository: new LocationDateOverrideRepositoryImpl(
          manager.getRepository(LocationDateOverrideOrmEntity),
        ),
        permitSettingsRepository: new PermitSettingsRepositoryImpl(
          manager.getRepository(PermitSettingOrmEntity),
        ),
        permitRepository: new PermitRepositoryImpl(
          manager.getRepository(PermitOrmEntity),
        ),
        passengerRepository: new PassengerRepositoryImpl(
          manager.getRepository(PassengerOrmEntity),
        ),
        vehicleRepository: new VehicleRepositoryImpl(
          manager.getRepository(VehicleOrmEntity),
        ),
      };

      return work(repositories);
    });
  }
}
