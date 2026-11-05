import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { User } from "@domain/entities/user.entity";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { UserRole } from "@domain/enums/user-role.enum";

import {
  CannotRemoveLastAdminException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";

@Injectable()
export class UpdateUserRoleUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(
    userId: string,
    role: UserRole,
    actorUserId: string,
  ): Promise<User> {
    return this.unitOfWork.execute(
      async ({ userRepository, auditLogRepository }) => {
        const user = await userRepository.findByIdForUpdate(userId);

        if (!user) {
          throw new UserNotFoundException();
        }

        const previousRole = user.role;

        if (previousRole === role) {
          return user;
        }

        const remainsExternalAdmin =
          user.tmarTravelRole.toLowerCase() === "admin";

        const isLosingLastEffectiveAdmin =
          previousRole === UserRole.ADMIN &&
          role !== UserRole.ADMIN &&
          !remainsExternalAdmin;

        if (
          isLosingLastEffectiveAdmin &&
          (await userRepository.countEffectiveAdmins()) <= 1
        ) {
          throw new CannotRemoveLastAdminException();
        }

        user.changeRole(role);

        const savedUser = await userRepository.save(user);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId,
            targetUserId: savedUser.id,
            action: AuditAction.USER_UPDATED,
            metadata: {
              field: "role",
              source: "TMAR_CERT",
              previousRole,
              newRole: role,
            },
          }),
        );

        return savedUser;
      },
    );
  }
}
