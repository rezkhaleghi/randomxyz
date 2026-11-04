import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { AuditLog } from "@domain/entities/audit-log.entity";

import { UserRole } from "@domain/enums/user-role.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

import { UserAlreadyExistsException } from "@domain/exceptions/domain.exception";

import { PasswordHasher } from "@application/interfaces/password-hasher.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { normalizeEmail } from "@domain/utils/normalize-email";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

export interface CreateAdminUserInput {
  email: string;
  password: string;
  role: UserRole;
}

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    private readonly passwordHasher: PasswordHasher,
    private readonly unitOfWork: UnitOfWork,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {}

  async execute(
    input: CreateAdminUserInput,
    actorUserId: string,
  ): Promise<User> {
    const email = normalizeEmail(input.email);

    const hashedPassword = await this.passwordHasher.hash(input.password);

    const currency = this.configService.getOrThrow(
      "DEFAULT_CURRENCY",
    ) as PaymentCurrency;

    return this.unitOfWork.execute(
      async ({ userRepository, userBalanceRepository, auditLogRepository }) => {
        if (await userRepository.findByEmail(email)) {
          throw new UserAlreadyExistsException(email);
        }

        const user = User.create({
          email,
          hashedPassword,
          role: input.role,
          emailVerified: true,
        });

        const saved = await userRepository.save(user);

        await userBalanceRepository.create(
          UserBalance.create({
            userId: saved.id,
            currency,
            amount: "0",
          }),
        );

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId,
            targetUserId: saved.id,
            action: AuditAction.USER_CREATED,
            metadata: {
              email: saved.email,
              role: saved.role,
            },
          }),
        );

        return saved;
      },
    );
  }
}
