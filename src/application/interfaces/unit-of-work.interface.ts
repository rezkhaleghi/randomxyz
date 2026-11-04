import { UserRepository } from "@domain/repositories/user.repository";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";
import { AuditLogRepository } from "@domain/repositories/audit-log.repository";
import { LedgerRepository } from "@domain/repositories/ledger.repository";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";
import { NotificationRepository } from "@domain/repositories/notification.repository";
import { PageRepository } from "@domain/repositories/page.repository";
import { LocationRepository } from "@domain/repositories/location.repository";
import { LocationDateOverrideRepository } from "@domain/repositories/location-date-override.repository";
import { PermitSettingsRepository } from "@domain/repositories/permit-setting.repository";

export interface UnitOfWorkRepositories {
  userRepository: UserRepository;
  userBalanceRepository: UserBalanceRepository;
  auditLogRepository: AuditLogRepository;
  ledgerRepository: LedgerRepository;
  depositRepository: DepositRepository;
  withdrawalRepository: WithdrawalRepository;
  notificationRepository: NotificationRepository;
  pageRepository: PageRepository;
  locationRepository: LocationRepository;
  locationDateOverrideRepository: LocationDateOverrideRepository;
  permitSettingsRepository: PermitSettingsRepository;
}

export abstract class UnitOfWork {
  abstract execute<T>(
    work: (repositories: UnitOfWorkRepositories) => Promise<T>,
  ): Promise<T>;
}
