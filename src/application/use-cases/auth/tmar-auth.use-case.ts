import { Injectable } from "@nestjs/common";

import { TmarIdentity } from "@application/interfaces/tmar-identity.interface";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { ApplicationUnauthorizedException } from "@application/exceptions/application-unauthorized.exception";

import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";

import { UserStatus } from "@domain/enums/user-status.enum";
import { UserRole } from "@domain/enums/user-role.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

@Injectable()
export class TmarAuthUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(identity: TmarIdentity): Promise<User> {
    const externalUserId = identity._id.trim();

    if (!externalUserId || !identity.role.trim()) {
      throw new ApplicationUnauthorizedException(
        "Invalid authentication identity.",
      );
    }

    if (identity.status === "blocked") {
      throw new ApplicationUnauthorizedException(
        "Your Tmar-Travel account is blocked.",
      );
    }

    const email = identity.email?.trim().toLowerCase() || null;

    return this.unitOfWork.execute(
      async ({ userRepository, userBalanceRepository }) => {
        let user = await userRepository.findByExternalUserId(externalUserId);

        if (!user) {
          const newUser = User.create({
            externalUserId,
            email,
            referrer: "tmar-travel",
            emailVerified: Boolean(email),
          });

          newUser.synchronizeTmarTravelProfile({
            externalUserId,
            email,
            firstName: identity.firstName,
            lastName: identity.lastName,
            role: identity.role,
          });

          user =
            await userRepository.createIfNotExistsByExternalUserId(newUser);
        }

        user = (await userRepository.findByIdForUpdate(user.id)) ?? user;

        if (user.status !== UserStatus.ACTIVE) {
          throw new ApplicationUnauthorizedException(
            "Your account is restricted.",
          );
        }

        const existingBalance =
          await userBalanceRepository.findByUserIdAndCurrency(
            user.id,
            PaymentCurrency.IRT,
          );

        if (!existingBalance) {
          await userBalanceRepository.create(
            UserBalance.create({
              userId: user.id,
              currency: PaymentCurrency.IRT,
              amount: "0",
            }),
          );
        }

        const shouldBeSuperAdmin =
          identity.role.trim().toLowerCase() === "admin";

        const profileChanged =
          user.externalUserId !== externalUserId ||
          user.email !== email ||
          user.firstName !== identity.firstName ||
          user.lastName !== identity.lastName ||
          user.tmarTravelRole !== identity.role ||
          user.emailVerified !== Boolean(email) ||
          (shouldBeSuperAdmin && user.role !== UserRole.SUPER_ADMIN);

        if (profileChanged) {
          user.synchronizeTmarTravelProfile({
            externalUserId,
            email,
            firstName: identity.firstName,
            lastName: identity.lastName,
            role: identity.role,
          });

          user = await userRepository.save(user);
        }

        return user;
      },
    );
  }
}
