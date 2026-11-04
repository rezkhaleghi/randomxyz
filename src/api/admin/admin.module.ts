import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { AdminAuthGuard } from "./admin-auth.guard";
import { AdminUsersController } from "./admin-users.controller";
import { AdminUserBalancesController } from "./admin-user-balances.controller";
import { AdminLedgersController } from "./admin-ledgers.controller";
import { AdminDepositsController } from "./admin-deposits.controller";
import { AdminWithdrawalsController } from "./admin-withdrawals.controller";
import { AdminNotificationsController } from "./admin-notifications.controller";
import { AdminPagesController } from "./admin-pages.controller";
import { AdminLocationsController } from "./admin-locations.controller";
import { AdminPermitSettingsController } from "./admin-permit-settings.controller";
import { AdminPermitsController } from "./admin-permits.controller";

@Module({
  imports: [ApplicationModule],
  controllers: [
    AdminUsersController,
    AdminUserBalancesController,
    AdminLedgersController,
    AdminDepositsController,
    AdminWithdrawalsController,
    AdminNotificationsController,
    AdminPagesController,
    AdminLocationsController,
    AdminPermitSettingsController,
    AdminPermitsController,
  ],
  providers: [AdminAuthGuard],
})
export class AdminModule {}
