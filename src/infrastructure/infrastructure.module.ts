import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import * as Joi from "joi";

import typeormConfig from "./config/typeorm.config";

import { UserOrmEntity } from "./database/orm-entities/user.orm-entity";
import { AuditLogOrmEntity } from "./database/orm-entities/audit-log.orm-entity";
import { UserBalanceOrmEntity } from "./database/orm-entities/user-balance.orm-entity";
import { LedgerOrmEntity } from "./database/orm-entities/ledger.orm-entity";
import { DepositOrmEntity } from "./database/orm-entities/deposit.orm-entity";
import { WithdrawalOrmEntity } from "./database/orm-entities/withdrawal.orm-entity";
import { NotificationOrmEntity } from "./database/orm-entities/notification.orm-entity";
import { PageOrmEntity } from "./database/orm-entities/page.orm-entity";
import { LocationOrmEntity } from "./database/orm-entities/location.orm-entity";
import { LocationDateOverrideOrmEntity } from "./database/orm-entities/location-date-override.orm-entity";
import { PermitOrmEntity } from "./database/orm-entities/permit.orm-entity";

import { UserRepositoryImpl } from "./database/repositories/user.repository.impl";
import { AuditLogRepositoryImpl } from "./database/repositories/audit-log.repository.impl";
import { UserBalanceRepositoryImpl } from "./database/repositories/user-balance.repository.impl";
import { LedgerRepositoryImpl } from "./database/repositories/ledger.repository.impl";
import { DepositRepositoryImpl } from "./database/repositories/deposit.repository.impl";
import { WithdrawalRepositoryImpl } from "./database/repositories/withdrawal.repository.impl";
import { NotificationRepositoryImpl } from "./database/repositories/notification.repository.impl";
import { PageRepositoryImpl } from "./database/repositories/page.repository.impl";
import { LocationRepositoryImpl } from "./database/repositories/location.repository.impl";
import { LocationDateOverrideRepositoryImpl } from "./database/repositories/location-date-override.repository.impl";
import { PermitRepositoryImpl } from "./database/repositories/permit.repository.impl";

import { UserRepository } from "@domain/repositories/user.repository";
import { AuditLogRepository } from "@domain/repositories/audit-log.repository";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";
import { LedgerRepository } from "@domain/repositories/ledger.repository";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";
import { NotificationRepository } from "@domain/repositories/notification.repository";
import { PageRepository } from "@domain/repositories/page.repository";
import { LocationRepository } from "@domain/repositories/location.repository";
import { LocationDateOverrideRepository } from "@domain/repositories/location-date-override.repository";
import { PermitRepository } from "@domain/repositories/permit.repository";

import { NotificationService } from "@application/interfaces/notification.service.interface";
import { SmtpNotificationService } from "./services/notification.service";

import { AdminStatisticsServiceImpl } from "./services/admin-statistics.service";
import { AdminStatisticsService } from "@application/interfaces/admin-statistics.interface";

import { TypeOrmUnitOfWork } from "./database/unit-of-work.typeorm";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { FakePaymentProvider } from "./services/fake-payment-provider.service";
import { ParsianPaymentProvider } from "./services/parsian-payment-provider.service";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_RESOLVER,
} from "@application/interfaces/payment-provider-resolver.interface";
import { PaymentProviderResolverService } from "./services/payment-provider-resolver.service";
import { PaymentProviderInterface } from "@application/interfaces/payment-provider.interface";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { EnvironmentConfig } from "./config/environment.config";

import { HtmlSanitizer } from "@application/interfaces/html-sanitizer.interface";
import { HtmlSanitizerService } from "./services/html-sanitizer.service";

import { TmarJwtService } from "./services/tmar-jwt.service";
import { TmarTravelLocationsClient } from "@application/interfaces/tmar-locations-client.interface";
import { TmarTravelLocationsClientService } from "./services/tmar-locations-client.service";

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid("development", "test", "production")
          .default("development"),

        PORT: Joi.number().port().default(5001),
        TRUST_PROXY: Joi.number().integer().min(0).default(1),

        FRONTEND_URL: Joi.string().uri().default("http://localhost:8080"),
        BACKEND_URL: Joi.string().uri().default("http://localhost:5001"),

        PARSIAN_PIN: Joi.string().allow("").default(""),
        PARSIAN_SALE_URL: Joi.string().uri().allow("").default(""),
        PARSIAN_CONFIRM_URL: Joi.string().uri().allow("").default(""),

        SWAGGER_ENABLED: Joi.boolean()
          .truthy("true")
          .falsy("false")
          .default(false),

        DEFAULT_CURRENCY: Joi.string()
          .valid(...Object.values(PaymentCurrency))
          .default(PaymentCurrency.IRT),

        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.number().port().default(5432),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_NAME: Joi.string().required(),

        SMTP_HOST: Joi.string().required(),
        SMTP_PORT: Joi.number().port().default(587),
        SMTP_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),
        SMTP_USER: Joi.string().required(),
        SMTP_PASSWORD: Joi.string().required(),
        SMTP_FROM: Joi.string().email().required(),

        TMAR_JWT_SECRET: Joi.string().min(32).required(),
        TMAR_TRAVEL_API_URL: Joi.string().required(),
      }),
    }),

    TypeOrmModule.forRootAsync({
      useFactory: () => typeormConfig(),
    }),

    TypeOrmModule.forFeature([
      UserOrmEntity,
      AuditLogOrmEntity,
      UserBalanceOrmEntity,
      LedgerOrmEntity,
      DepositOrmEntity,
      WithdrawalOrmEntity,
      NotificationOrmEntity,
      PageOrmEntity,
      LocationOrmEntity,
      LocationDateOverrideOrmEntity,
      PermitOrmEntity,
    ]),
  ],

  providers: [
    { provide: UserRepository, useClass: UserRepositoryImpl },
    SmtpNotificationService,
    {
      provide: NotificationService,
      useExisting: SmtpNotificationService,
    },

    AdminStatisticsServiceImpl,
    {
      provide: AdminStatisticsService,
      useExisting: AdminStatisticsServiceImpl,
    },

    { provide: AuditLogRepository, useClass: AuditLogRepositoryImpl },
    { provide: UserBalanceRepository, useClass: UserBalanceRepositoryImpl },
    { provide: UnitOfWork, useClass: TypeOrmUnitOfWork },
    { provide: LedgerRepository, useClass: LedgerRepositoryImpl },
    { provide: DepositRepository, useClass: DepositRepositoryImpl },
    { provide: WithdrawalRepository, useClass: WithdrawalRepositoryImpl },

    FakePaymentProvider,
    ParsianPaymentProvider,

    {
      provide: PAYMENT_PROVIDERS,
      inject: [ConfigService, FakePaymentProvider, ParsianPaymentProvider],
      useFactory: (
        configService: ConfigService<EnvironmentConfig>,
        fakePaymentProvider: FakePaymentProvider,
        parsianPaymentProvider: ParsianPaymentProvider,
      ): PaymentProviderInterface[] => {
        const providers: PaymentProviderInterface[] = [];
        const nodeEnv = configService.get("NODE_ENV");

        if (nodeEnv === "development" || nodeEnv === "test") {
          providers.push(fakePaymentProvider);
        }

        const parsianPin = configService.get("PARSIAN_PIN");
        const parsianSaleUrl = configService.get("PARSIAN_SALE_URL");
        const parsianConfirmUrl = configService.get("PARSIAN_CONFIRM_URL");

        if (parsianPin && parsianSaleUrl && parsianConfirmUrl) {
          providers.push(parsianPaymentProvider);
        }

        return providers;
      },
    },

    {
      provide: PAYMENT_PROVIDER_RESOLVER,
      useClass: PaymentProviderResolverService,
    },

    { provide: NotificationRepository, useClass: NotificationRepositoryImpl },
    { provide: PageRepository, useClass: PageRepositoryImpl },
    { provide: HtmlSanitizer, useClass: HtmlSanitizerService },

    { provide: LocationRepository, useClass: LocationRepositoryImpl },
    {
      provide: TmarTravelLocationsClient,
      useClass: TmarTravelLocationsClientService,
    },
    {
      provide: LocationDateOverrideRepository,
      useClass: LocationDateOverrideRepositoryImpl,
    },
    { provide: PermitRepository, useClass: PermitRepositoryImpl },

    TmarJwtService,
  ],

  exports: [
    UserRepository,
    NotificationService,
    AdminStatisticsService,
    AuditLogRepository,
    UserBalanceRepository,
    UnitOfWork,
    LedgerRepository,
    DepositRepository,
    WithdrawalRepository,
    PAYMENT_PROVIDER_RESOLVER,
    NotificationRepository,
    PageRepository,
    HtmlSanitizer,
    TmarJwtService,
    LocationRepository,
    TmarTravelLocationsClient,
    LocationDateOverrideRepository,
    PermitRepository,
  ],
})
export class InfrastructureModule {}
