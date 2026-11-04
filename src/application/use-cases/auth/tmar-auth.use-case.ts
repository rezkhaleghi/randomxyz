import { Injectable, UnauthorizedException } from "@nestjs/common";

import { TmarIdentity } from "@application/interfaces/tmar-identity.interface";

import { User } from "@domain/entities/user.entity";
import { UserStatus } from "@domain/enums/user-status.enum";
import { UserRepository } from "@domain/repositories/user.repository";

@Injectable()
export class TmarAuthUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(identity: TmarIdentity): Promise<User> {
    const externalUserId = identity._id.trim();
    const email = identity.email.trim().toLowerCase();

    if (!externalUserId || !email) {
      throw new UnauthorizedException("Invalid authentication identity.");
    }

    // Reject users blocked by Tmar-Travel.
    if (identity.status === "blocked") {
      throw new UnauthorizedException("Your Tmar-Travel account is blocked.");
    }

    let user = await this.userRepository.findByExternalUserId(externalUserId);

    if (!user) {
      const newUser = User.create({
        externalUserId,
        email,
        hashedPassword: null,
        emailVerified: true,
      });

      newUser.synchronizeTmarTravelProfile({
        externalUserId,
        email,
        firstName: identity.firstName,
        lastName: identity.lastName,
      });

      // The repository handles concurrent first-time requests atomically.
      user =
        await this.userRepository.createIfNotExistsByExternalUserId(newUser);
    }

    // Never synchronize profile data for restricted local accounts.
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Your account is restricted.");
    }

    const profileChanged =
      user.externalUserId !== externalUserId ||
      user.email !== email ||
      user.firstName !== identity.firstName ||
      user.lastName !== identity.lastName ||
      !user.emailVerified;

    if (profileChanged) {
      user.synchronizeTmarTravelProfile({
        externalUserId,
        email,
        firstName: identity.firstName,
        lastName: identity.lastName,
      });

      user = await this.userRepository.save(user);
    }

    return user;
  }
}
