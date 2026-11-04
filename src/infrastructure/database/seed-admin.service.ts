import { Injectable, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";

import { UserRole } from "@domain/enums/user-role.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

import { PasswordHasher } from "@application/interfaces/password-hasher.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { normalizeEmail } from "@domain/utils/normalize-email";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

@Injectable()
export class SeedAdminService implements OnModuleInit {
  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
    private readonly unitOfWork: UnitOfWork,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async onModuleInit(): Promise<void> {
    const configuredEmail = this.configService.get("INITIAL_ADMIN_EMAIL");
    const password = this.configService.get("INITIAL_ADMIN_PASSWORD");

    if (!configuredEmail || !password) {
      return;
    }

    const email = normalizeEmail(configuredEmail);

    const existingUser = await this.unitOfWork.execute(
      async ({ userRepository }) => userRepository.findByEmail(email),
    );

    if (existingUser) {
      return;
    }

    const currency = this.configService.getOrThrow(
      "DEFAULT_CURRENCY",
    ) as PaymentCurrency;

    const admin = User.create({
      email,
      hashedPassword: await this.passwordHasher.hash(password),
      role: UserRole.ADMIN,
      emailVerified: true,
    });

    await this.unitOfWork.execute(
      async ({ userRepository, userBalanceRepository }) => {
        const existing = await userRepository.findByEmail(email);

        if (existing) {
          return;
        }

        const saved = await userRepository.save(admin);

        await userBalanceRepository.create(
          UserBalance.create({
            userId: saved.id,
            currency,
            amount: "0",
          }),
        );
      },
    );
  }
}
