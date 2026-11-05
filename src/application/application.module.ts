import { Module } from "@nestjs/common";

import { TmarAuthUseCase } from "./use-cases/auth/tmar-auth.use-case";

import { GetCurrentUserUseCase } from "./use-cases/users/get-current-user.use-case";
import { GetUserBalancesUseCase } from "./use-cases/users/get-user-balances.use-case";

import { ListUsersUseCase } from "./use-cases/admin-users/list-users.use-case";
import { GetUserUseCase } from "./use-cases/admin-users/get-user.use-case";
import { GetAdminStatisticsUseCase } from "./use-cases/admin-users/get-statistics.use-case";
import { GetAuditLogsUseCase } from "./use-cases/admin-users/get-audit-logs.use-case";

import { UpdateUserBalanceUseCase } from "./use-cases/admin-financials/update-user-balance.use-case";
import { ListLedgersUseCase } from "./use-cases/admin-financials/list-ledgers.use-case";
import { CreateDepositUseCase } from "./use-cases/deposits/create-deposit.use-case";
import { VerifyDepositUseCase } from "./use-cases/deposits/verify-deposit.use-case";
import { HandleParsianCallbackUseCase } from "./use-cases/deposits/handle-parsian-callback.use-case";
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
import { AdminListLocationsUseCase } from "./use-cases/admin-locations/list-locations.use-case";
import { UpdateLocationUseCase } from "./use-cases/admin-locations/update-location.use-case";
import { ListLocationDateOverridesUseCase } from "./use-cases/admin-locations/list-location-date-overrides.use-case";
import { UpsertLocationDateOverrideUseCase } from "./use-cases/admin-locations/upsert-location-date-override.use-case";
import { DeleteLocationDateOverrideUseCase } from "./use-cases/admin-locations/delete-location-date-override.use-case";

import { GetPermitSettingsUseCase } from "./use-cases/admin-settings/get-permit-setting.use-case";
import { UpdatePermitSettingsUseCase } from "./use-cases/admin-settings/update-permit-setting.use-case";
import { GetLocationUseCase } from "./use-cases/locations/get-location.use-case";
import { ListLocationsUseCase } from "./use-cases/locations/list-locations.use-case";
import { AdminGetLocationUseCase } from "./use-cases/admin-locations/get-location.use-case";
import { GetLocationAvailabilityUseCase } from "./use-cases/locations/get-location-availability.use-case";

import { CreatePermitUseCase } from "./use-cases/permits/create-permit.use-case";
import { ListPermitsUseCase } from "./use-cases/permits/list-permits.use-case";
import { GetPermitUseCase } from "./use-cases/permits/get-permit.use-case";
import { EndPermitUseCase } from "./use-cases/permits/end-permit.use-case";
import { VerifyPermitUseCase } from "./use-cases/permits/verify-permit.use-case";
import { ExpirePermitsUseCase } from "./use-cases/permits/expire-permits.use-case";
import { AdminListPermitsUseCase } from "./use-cases/admin-permits/list-permits.use-case";
import { AdminGetPermitUseCase } from "./use-cases/admin-permits/get-permit.use-case";
import { AdminUpdatePermitUseCase } from "./use-cases/admin-permits/update-permit.use-case";
import { AdminRevokePermitUseCase } from "./use-cases/admin-permits/revoke-permit.use-case";
import { UpdateUserRoleUseCase } from "./use-cases/admin-users/update-user-role.use-case";
import { ListUserLedgersUseCase } from "./use-cases/users/list-user-ledgers.use-case";

@Module({
  imports: [],

  providers: [
    TmarAuthUseCase,

    GetCurrentUserUseCase,
    GetUserBalancesUseCase,

    CreateDepositUseCase,
    VerifyDepositUseCase,
    HandleParsianCallbackUseCase,
    ListDepositsUseCase,
    GetDepositUseCase,

    CreateWithdrawalUseCase,
    ListWithdrawalsUseCase,
    GetWithdrawalUseCase,

    SendNotificationUseCase,
    ListUserNotificationsUseCase,
    MarkNotificationReadUseCase,

    GetPublicPageUseCase,

    SyncLocationsUseCase,

    ListLocationsUseCase,
    UpdateLocationUseCase,

    CreatePageUseCase,
    ListPagesUseCase,
    GetPageUseCase,
    UpdatePageUseCase,
    DeletePageUseCase,

    AdminListNotificationsUseCase,
    AdminGetNotificationUseCase,

    ListUsersUseCase,
    GetUserUseCase,
    GetAdminStatisticsUseCase,
    GetAuditLogsUseCase,
    UpdateUserRoleUseCase,
    ListUserLedgersUseCase,

    ListLocationDateOverridesUseCase,
    UpsertLocationDateOverrideUseCase,
    DeleteLocationDateOverrideUseCase,
    AdminListLocationsUseCase,
    AdminGetLocationUseCase,
    GetLocationUseCase,
    GetLocationAvailabilityUseCase,

    GetPermitSettingsUseCase,
    UpdatePermitSettingsUseCase,

    VerifyPermitUseCase,
    ExpirePermitsUseCase,

    AdminListPermitsUseCase,
    AdminGetPermitUseCase,
    AdminUpdatePermitUseCase,
    AdminRevokePermitUseCase,

    CreatePermitUseCase,
    ListPermitsUseCase,
    GetPermitUseCase,
    EndPermitUseCase,

    UpdateUserBalanceUseCase,
    ListLedgersUseCase,
    AdminListDepositsUseCase,
    AdminGetDepositUseCase,
    AdminListWithdrawalsUseCase,
    AdminGetWithdrawalUseCase,
    AdminUpdateWithdrawalStatusUseCase,
  ],

  exports: [
    TmarAuthUseCase,

    GetCurrentUserUseCase,
    GetUserBalancesUseCase,

    CreateDepositUseCase,
    VerifyDepositUseCase,
    HandleParsianCallbackUseCase,
    ListDepositsUseCase,
    GetDepositUseCase,

    CreateWithdrawalUseCase,
    ListWithdrawalsUseCase,
    GetWithdrawalUseCase,

    SendNotificationUseCase,
    MarkNotificationReadUseCase,
    ListUserNotificationsUseCase,

    GetPublicPageUseCase,

    SyncLocationsUseCase,

    CreatePageUseCase,
    UpdatePageUseCase,
    DeletePageUseCase,
    ListPagesUseCase,
    GetPageUseCase,

    AdminListNotificationsUseCase,
    AdminGetNotificationUseCase,

    ListUsersUseCase,
    GetUserUseCase,
    GetAdminStatisticsUseCase,
    GetAuditLogsUseCase,
    UpdateUserRoleUseCase,
    ListUserLedgersUseCase,

    ListLocationDateOverridesUseCase,
    UpsertLocationDateOverrideUseCase,
    DeleteLocationDateOverrideUseCase,
    AdminListLocationsUseCase,
    AdminGetLocationUseCase,
    ListLocationsUseCase,
    GetLocationUseCase,
    GetLocationAvailabilityUseCase,
    UpdateLocationUseCase,

    GetPermitSettingsUseCase,
    UpdatePermitSettingsUseCase,

    VerifyPermitUseCase,
    ExpirePermitsUseCase,

    AdminListPermitsUseCase,
    AdminGetPermitUseCase,
    AdminUpdatePermitUseCase,
    AdminRevokePermitUseCase,

    CreatePermitUseCase,
    ListPermitsUseCase,
    GetPermitUseCase,
    EndPermitUseCase,

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
