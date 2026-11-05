import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";

import { AdminModule } from "./api/admin/admin.module";
import { AuthModule } from "./api/auth/auth.module";
import { DepositsModule } from "./api/deposits/deposits.module";
import { HealthModule } from "./api/health/health.module";
import { UsersModule } from "./api/users/users.module";
import { WithdrawalsModule } from "./api/withdrawals/withdrawals.module";
import { LocationsModule } from "./api/locations/locations.module";
import { PermitsModule } from "./api/permits/permits.module";

import { ApplicationModule } from "./application/application.module";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";

import {
  AcceptLanguageResolver,
  HeaderResolver,
  I18nModule,
} from "nestjs-i18n";
import * as path from "path";

import { PagesModule } from "@api/pages/pages.module";

import { LocationSyncScheduler } from "./infrastructure/services/location-sync.scheduler";
import { PermitExpirationScheduler } from "./infrastructure/services/permit-expiration.scheduler";

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 60,
      },
    ]),

    I18nModule.forRoot({
      fallbackLanguage: "en",
      loaderOptions: {
        path: path.join(__dirname, "i18n"),
        watch: process.env.NODE_ENV !== "production",
      },
      resolvers: [new HeaderResolver(["x-lang"]), AcceptLanguageResolver],
    }),

    InfrastructureModule,
    ApplicationModule,

    AuthModule,
    AdminModule,

    UsersModule,
    LocationsModule,
    PermitsModule,

    DepositsModule,
    WithdrawalsModule,

    HealthModule,
    PagesModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    LocationSyncScheduler,
    PermitExpirationScheduler,
  ],
})
export class AppModule {}
