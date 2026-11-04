import { BadRequestException, Injectable } from "@nestjs/common";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface UpdatePermitSettingsInput {
  actorUserId: string;
  defaultFee: string;
}

@Injectable()
export class UpdatePermitSettingsUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdatePermitSettingsInput) {
    if (!/^(0|[1-9]\d*)$/.test(input.defaultFee)) {
      throw new BadRequestException(
        "Default permit fee must be a non-negative integer.",
      );
    }

    return this.unitOfWork.execute(
      async ({ permitSettingsRepository, auditLogRepository }) => {
        const settings = await permitSettingsRepository.findOrCreateForUpdate();

        const previousFee = settings.defaultFee;

        settings.defaultFee = input.defaultFee;

        const updated = await permitSettingsRepository.save(settings);

        if (previousFee !== updated.defaultFee) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId: input.actorUserId,
              action: AuditAction.PERMIT_SETTINGS_UPDATED,
              targetUserId: null,
              metadata: {
                currency: "IRT",
                before: {
                  defaultFee: previousFee,
                },
                after: {
                  defaultFee: updated.defaultFee,
                },
              },
            }),
          );
        }

        return {
          defaultFee: updated.defaultFee,
          currency: "IRT",
          updatedAt: updated.updatedAt,
        };
      },
    );
  }
}
