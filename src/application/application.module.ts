import { Module } from "@nestjs/common";

import { TmarAuthUseCase } from "./use-cases/auth/tmar-auth.use-case";

import { GetCurrentUserUseCase } from "./use-cases/users/get-current-user.use-case";
import { GetUserBalancesUseCase } from "./use-cases/users/get-user-balances.use-case";

import { ListUsersUseCase } from "./use-cases/admin-users/list-users.use-case";
import { GetUserUseCase } from "./use-cases/admin-users/get-user.use-case";
import { CreateAdminUserUseCase } from "./use-cases/admin-users/create-user.use-case";
import { GetAdminStatisticsUseCase } from "./use-cases/admin-users/get-statistics.use-case";
import { GetAuditLogsUseCase } from "./use-cases/admin-users/get-audit-logs.use-case";

import { UpdateUserBalanceUseCase } from "./use-cases/admin-financials/update-user-balance.use-case";
import { ListLedgersUseCase } from "./use-cases/admin-financials/list-ledgers.use-case";
import { CreateDepositUseCase } from "./use-cases/deposits/create-deposit.use-case";
import { VerifyDepositUseCase } from "./use-cases/deposits/verify-deposit.use-case";
import { AdminListDepositsUseCase } from "./use-cases/admin-financials/list-deposits.use-case";
import { AdminGetDepositUseCase } from "./use-cases/admin-financials/get-deposit.use-case";
import { CreateWithdrawalUseCase } from "./use-cases/withdrawals/create-withdrawal.use-case";
import { AdminListWithdrawalsUseCase } from "./use-cases/admin-financials/list-withdrawals.use-case";
import { AdminGetWithdrawalUseCase } from "./use-cases/admin-financials/get-withdrawal.use-case";
import { AdminUpdateWithdrawalStatusUseCase } from "./use-cases/admin-financials/update-withdrawal-status.use-case";

import { ListDepositsUseCase } from "./use-cases/deposits/list-deposits.use-case";
import { GetDepositUseCase } from "./use-cases/deposits/get-deposit.use-case";
import { ListWithdrawalsUseCase } from "./use-cases/withdrawals/list-withdrawals.use-case";
import { GetWithdrawalUseCase } from "./use-cases/withdrawals/get-withdrawal.use-case";

import { SendNotificationUseCase } from "./use-cases/notifications/send-notification.use-case";
import { ListUserNotificationsUseCase } from "./use-cases/notifications/list-user-notifications.use-case";
import { MarkNotificationReadUseCase } from "./use-cases/notifications/mark-notification-read.use-case";

import { AdminListNotificationsUseCase } from "./use-cases/admin-notifications/list-notifications.use-case";
import { AdminGetNotificationUseCase } from "./use-cases/admin-notifications/get-notification.use-case";
import { CreatePageUseCase } from "./use-cases/admin-pages/create-page.use-case";
import { ListPagesUseCase } from "./use-cases/admin-pages/list-pages.use-case";
import { GetPageUseCase } from "./use-cases/admin-pages/get-page.use-case";
import { UpdatePageUseCase } from "./use-cases/admin-pages/update-page.use-case";
import { DeletePageUseCase } from "./use-cases/admin-pages/delete-page.use-case";
import { GetPublicPageUseCase } from "./use-cases/pages/get-page.use-case";

import { SyncLocationsUseCase } from "@application/use-cases/locations/sync-locations.use-case";
/**
 * Registers application use cases. Infrastructure bindings are supplied by
 * the composition root and injected through application interfaces.
 */
@Module({
  imports: [],

  providers: [
    // Authentication
    TmarAuthUseCase,

    // Users
    GetCurrentUserUseCase,
    GetUserBalancesUseCase,

    // Deposits
    CreateDepositUseCase,
    VerifyDepositUseCase,
    ListDepositsUseCase,
    GetDepositUseCase,

    // Withdrawals
    CreateWithdrawalUseCase,
    ListWithdrawalsUseCase,
    GetWithdrawalUseCase,

    // Notifications
    SendNotificationUseCase,
    ListUserNotificationsUseCase,
    MarkNotificationReadUseCase,

    // Pages
    GetPublicPageUseCase,

    // Location
    SyncLocationsUseCase,

    // Admin Pages
    CreatePageUseCase,
    ListPagesUseCase,
    GetPageUseCase,
    UpdatePageUseCase,
    DeletePageUseCase,

    // Admin Notifications
    AdminListNotificationsUseCase,
    AdminGetNotificationUseCase,

    // Admin users
    ListUsersUseCase,
    GetUserUseCase,
    CreateAdminUserUseCase,
    GetAdminStatisticsUseCase,
    GetAuditLogsUseCase,

    // Admin financials
    UpdateUserBalanceUseCase,
    ListLedgersUseCase,
    AdminListDepositsUseCase,
    AdminGetDepositUseCase,
    AdminListWithdrawalsUseCase,
    AdminGetWithdrawalUseCase,
    AdminUpdateWithdrawalStatusUseCase,
  ],

  exports: [
    // Authentication
    TmarAuthUseCase,

    // Users
    GetCurrentUserUseCase,
    GetUserBalancesUseCase,

    // Deposits
    CreateDepositUseCase,
    VerifyDepositUseCase,
    ListDepositsUseCase,
    GetDepositUseCase,

    // Withdrawals
    CreateWithdrawalUseCase,
    ListWithdrawalsUseCase,
    GetWithdrawalUseCase,

    // Notifications
    SendNotificationUseCase,
    MarkNotificationReadUseCase,
    ListUserNotificationsUseCase,

    // Page
    GetPublicPageUseCase,

    // Location
    SyncLocationsUseCase,

    // Admin Page
    CreatePageUseCase,
    UpdatePageUseCase,
    DeletePageUseCase,
    ListPagesUseCase,
    GetPageUseCase,

    // Admin Notifications
    AdminListNotificationsUseCase,
    AdminGetNotificationUseCase,

    // Admin users
    ListUsersUseCase,
    GetUserUseCase,
    CreateAdminUserUseCase,
    GetAdminStatisticsUseCase,
    GetAuditLogsUseCase,

    // Admin financials
    UpdateUserBalanceUseCase,
    ListLedgersUseCase,
    AdminListDepositsUseCase,
    AdminGetDepositUseCase,
    AdminListWithdrawalsUseCase,
    AdminGetWithdrawalUseCase,
    AdminUpdateWithdrawalStatusUseCase,
  ],
})
export class ApplicationModule {}
