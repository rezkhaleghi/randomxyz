import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { createClient } from "redis";
import * as Joi from "joi";

import typeormConfig from "./config/typeorm.config";

import { UserOrmEntity } from "./database/orm-entities/user.orm-entity";
import { AuditLogOrmEntity } from "./database/orm-entities/audit-log.orm-entity";
import { UserBalanceOrmEntity } from "./database/orm-entities/user-balance.orm-entity";
import { LedgerOrmEntity } from "./database/orm-entities/ledger.orm-entity";
import { DepositOrmEntity } from "./database/orm-entities/deposit.orm-entity";
import { WithdrawalOrmEntity } from "./database/orm-entities/withdrawal.orm-entity";

import { UserRepositoryImpl } from "./database/repositories/user.repository.impl";
import { AuditLogRepositoryImpl } from "./database/repositories/audit-log.repository.impl";
import { UserBalanceRepositoryImpl } from "./database/repositories/user-balance.repository.impl";
import { LedgerRepositoryImpl } from "./database/repositories/ledger.repository.impl";
import { DepositRepositoryImpl } from "./database/repositories/deposit.repository.impl";
import { WithdrawalRepositoryImpl } from "./database/repositories/withdrawal.repository.impl";

import { UserRepository } from "@domain/repositories/user.repository";
import { AuditLogRepository } from "@domain/repositories/audit-log.repository";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";
import { LedgerRepository } from "@domain/repositories/ledger.repository";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { WithdrawalRepository } from "@domain/repositories/withdrawal.repository";

import { BcryptPasswordHasher } from "./services/bcrypt-password-hasher.service";
import { PasswordHasher } from "@application/interfaces/password-hasher.interface";

import { OtpServiceImpl } from "./services/otp.service.impl";
import { RedisOtpStore } from "./services/redis-otp.store";
import { OtpService } from "@application/interfaces/otp.service.interface";

import { SeedAdminService } from "./database/seed-admin.service";

import { NotificationService } from "@application/interfaces/notification.service.interface";
import { SmtpNotificationService } from "./services/notification.service";

import { RedisClientLifecycle } from "./services/redis-client.lifecycle";

import { MinioService } from "./services/minio.service";
import { FileStorage } from "@application/interfaces/file-storage.interface";

import { ImageProcessingService } from "./services/image-processing.service";
import { ImageProcessing } from "@application/interfaces/image-processing.interface";

import { AdminStatisticsServiceImpl } from "./services/admin-statistics.service";
import { AdminStatisticsService } from "@application/interfaces/admin-statistics.interface";

import { TypeOrmUnitOfWork } from "./database/unit-of-work.typeorm";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { FakePaymentProvider } from "./services/fake-payment-provider.service";
import {
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_RESOLVER,
} from "@application/interfaces/payment-provider-resolver.interface";
import { PaymentProviderResolverService } from "./services/payment-provider-resolver.service";
import { PaymentProviderInterface } from "@application/interfaces/payment-provider.interface";

import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { EnvironmentConfig } from "./config/environment.config";

import { NotificationOrmEntity } from "./database/orm-entities/notification.orm-entity";
import { NotificationRepositoryImpl } from "./database/repositories/notification.repository.impl";
import { NotificationRepository } from "@domain/repositories/notification.repository";
import { PageRepository } from "@domain/repositories/page.repository";
import { PageRepositoryImpl } from "./database/repositories/page.repository.impl";
import { HtmlSanitizer } from "@application/interfaces/html-sanitizer.interface";
import { HtmlSanitizerService } from "./services/html-sanitizer.service";
import { PageOrmEntity } from "./database/orm-entities/page.orm-entity";

import { TmarJwtService } from "./services/tmar-jwt.service";

/**
 * Infrastructure composition root.
 *
 * This is the boundary where application/domain abstractions are connected
 * to concrete infrastructure implementations such as TypeORM, Redis,
 * SMTP, MinIO and bcrypt.
 *
 * Environment validation also lives here so the application fails fast
 * during startup instead of discovering a missing configuration later.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],

      validationSchema: Joi.object({
        // -------------------------------------------------------------------
        // Application
        // -------------------------------------------------------------------

        NODE_ENV: Joi.string()
          .valid("development", "test", "production")
          .default("development"),

        PORT: Joi.number().port().default(3000),

        TRUST_PROXY: Joi.number().integer().min(0).default(1),

        FRONTEND_URL: Joi.string().uri().default("http://localhost:8080"),

        SWAGGER_ENABLED: Joi.boolean()
          .truthy("true")
          .falsy("false")
          .default(false),

        DEFAULT_CURRENCY: Joi.string()
          .valid(...Object.values(PaymentCurrency))
          .default(PaymentCurrency.IRT),

        // -------------------------------------------------------------------
        // PostgreSQL
        // -------------------------------------------------------------------

        DB_HOST: Joi.string().required(),

        DB_PORT: Joi.number().port().default(5432),

        DB_USERNAME: Joi.string().required(),

        DB_PASSWORD: Joi.string().required(),

        DB_NAME: Joi.string().required(),

        // -------------------------------------------------------------------
        // Redis
        // -------------------------------------------------------------------

        REDIS_HOST: Joi.string().required(),

        REDIS_PORT: Joi.number().port().default(6379),

        REDIS_PASSWORD: Joi.string().allow("").default(""),

        REDIS_TLS: Joi.boolean().truthy("true").falsy("false").default(false),

        // -------------------------------------------------------------------
        // OTP / authentication protection
        // -------------------------------------------------------------------

        OTP_EXPIRY_SECONDS: Joi.number()
          .integer()
          .min(60)
          .max(900)
          .default(300),

        OTP_MAX_ATTEMPTS: Joi.number().integer().min(1).max(10).default(5),

        OTP_RESEND_COOLDOWN_SECONDS: Joi.number().integer().min(1).default(60),

        OTP_LOG_CODE: Joi.boolean()
          .truthy("true")
          .falsy("false")
          .default(false),

        LOGIN_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),

        LOGIN_ATTEMPT_WINDOW_SECONDS: Joi.number()
          .integer()
          .min(60)
          .default(900),

        LOGIN_LOCK_SECONDS: Joi.number().integer().min(60).default(900),

        // -------------------------------------------------------------------
        // SMTP
        // -------------------------------------------------------------------

        SMTP_HOST: Joi.string().required(),

        SMTP_PORT: Joi.number().port().default(587),

        SMTP_SECURE: Joi.boolean().truthy("true").falsy("false").default(false),

        SMTP_USER: Joi.string().required(),

        SMTP_PASSWORD: Joi.string().required(),

        SMTP_FROM: Joi.string().email().required(),

        // -------------------------------------------------------------------
        // Sessions (temporarily retained during migration)
        // -------------------------------------------------------------------

        SESSION_SECRET: Joi.string().min(32).required(),

        // -------------------------------------------------------------------
        // Tmar authentication
        // -------------------------------------------------------------------

        TMAR_JWT_SECRET: Joi.string().min(32).required(),

        // -------------------------------------------------------------------
        // Initial administrator (temporarily retained)
        // -------------------------------------------------------------------

        INITIAL_ADMIN_EMAIL: Joi.string().email().allow("").default(""),

        INITIAL_ADMIN_PASSWORD: Joi.string().min(12).allow("").default(""),

        // -------------------------------------------------------------------
        // Google OAuth
        // -------------------------------------------------------------------

        GOOGLE_CLIENT_ID: Joi.string().required(),

        GOOGLE_CLIENT_SECRET: Joi.string().required(),

        GOOGLE_CALLBACK_URL: Joi.string().uri().required(),

        // -------------------------------------------------------------------
        // MinIO
        // -------------------------------------------------------------------

        MINIO_ENDPOINT: Joi.string().required(),

        MINIO_PORT: Joi.number().port().default(9000),

        MINIO_ACCESS_KEY: Joi.string().required(),

        MINIO_SECRET_KEY: Joi.string().required(),

        MINIO_BUCKET: Joi.string().required(),

        MINIO_USE_SSL: Joi.boolean()
          .truthy("true")
          .falsy("false")
          .default(false),
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
    ]),
  ],

  providers: [
    {
      provide: "REDIS_CLIENT",
      inject: [ConfigService],
      useFactory: async (configService: ConfigService<EnvironmentConfig>) => {
        const redisTls = configService.get("REDIS_TLS");

        const client = createClient({
          socket: {
            host: configService.getOrThrow("REDIS_HOST"),
            port: configService.getOrThrow("REDIS_PORT"),
            ...(redisTls ? { tls: true } : {}),
            connectTimeout: 10_000,
            reconnectStrategy: (retries) => Math.min(100 * 2 ** retries, 5_000),
          },
          password: configService.get("REDIS_PASSWORD") || undefined,
        });

        client.on("error", (error) => {
          // Redis emits connection errors asynchronously.
          // Keeping a listener prevents an unhandled Redis "error" event.
          console.error("Redis client error:", error);
        });

        await client.connect();

        return client;
      },
    },

    RedisClientLifecycle,

    {
      provide: UserRepository,
      useClass: UserRepositoryImpl,
    },

    {
      provide: PasswordHasher,
      useClass: BcryptPasswordHasher,
    },

    RedisOtpStore,

    SmtpNotificationService,

    {
      provide: NotificationService,
      useExisting: SmtpNotificationService,
    },

    {
      provide: OtpService,
      useClass: OtpServiceImpl,
    },

    SeedAdminService,

    TmarJwtService,

    MinioService,

    {
      provide: FileStorage,
      useExisting: MinioService,
    },

    ImageProcessingService,

    {
      provide: ImageProcessing,
      useClass: ImageProcessingService,
    },

    AdminStatisticsServiceImpl,

    {
      provide: AdminStatisticsService,
      useExisting: AdminStatisticsServiceImpl,
    },

    {
      provide: AuditLogRepository,
      useClass: AuditLogRepositoryImpl,
    },

    {
      provide: UserBalanceRepository,
      useClass: UserBalanceRepositoryImpl,
    },

    {
      provide: UnitOfWork,
      useClass: TypeOrmUnitOfWork,
    },

    {
      provide: LedgerRepository,
      useClass: LedgerRepositoryImpl,
    },

    {
      provide: DepositRepository,
      useClass: DepositRepositoryImpl,
    },

    {
      provide: WithdrawalRepository,
      useClass: WithdrawalRepositoryImpl,
    },

    FakePaymentProvider,

    {
      provide: PAYMENT_PROVIDERS,
      inject: [ConfigService, FakePaymentProvider],
      useFactory: (
        configService: ConfigService,
        fakePaymentProvider: FakePaymentProvider,
      ): PaymentProviderInterface[] => {
        const nodeEnv = configService.get<string>("NODE_ENV");

        if (nodeEnv !== "development" && nodeEnv !== "test") {
          return [];
        }

        return [fakePaymentProvider];
      },
    },

    {
      provide: PAYMENT_PROVIDER_RESOLVER,
      useClass: PaymentProviderResolverService,
    },

    {
      provide: NotificationRepository,
      useClass: NotificationRepositoryImpl,
    },

    {
      provide: PageRepository,
      useClass: PageRepositoryImpl,
    },

    {
      provide: HtmlSanitizer,
      useClass: HtmlSanitizerService,
    },
  ],

  exports: [
    UserRepository,
    PasswordHasher,
    OtpService,
    NotificationService,
    "REDIS_CLIENT",
    FileStorage,
    ImageProcessing,
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
  ],
})
export class InfrastructureModule {}
