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

    let user = await this.userRepository.findByExternalUserId(externalUserId);

    if (!user) {
      user = User.create({
        externalUserId,
        email,
        hashedPassword: null,
        emailVerified: true,
      });

      user.synchronizeTmarTravelProfile({
        externalUserId,
        email,
        firstName: identity.firstName,
        lastName: identity.lastName,
      });
    } else {
      user.synchronizeTmarTravelProfile({
        externalUserId,
        email,
        firstName: identity.firstName,
        lastName: identity.lastName,
      });
    }

    user = await this.userRepository.save(user);

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Your account is restricted.");
    }

    return user;
  }
}
