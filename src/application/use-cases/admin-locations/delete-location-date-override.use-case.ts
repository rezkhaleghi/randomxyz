import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

export interface DeleteLocationDateOverrideInput {
  actorUserId: string;
  locationId: string;
  overrideId: string;
}

@Injectable()
export class DeleteLocationDateOverrideUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: DeleteLocationDateOverrideInput): Promise<void> {
    await this.unitOfWork.execute(
      async ({ locationDateOverrideRepository, auditLogRepository }) => {
        const override = await locationDateOverrideRepository.findByIdForUpdate(
          input.locationId,
          input.overrideId,
        );

        if (!override) {
          throw new NotFoundException("Location date override not found.");
        }

        await locationDateOverrideRepository.deleteById(override.id);

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            action: AuditAction.LOCATION_DATE_OVERRIDE_DELETED,
            targetUserId: null,
            metadata: {
              locationId: input.locationId,
              overrideId: override.id,
              date: override.date,
              capacity: override.capacity,
              fee: override.fee,
            },
          }),
        );
      },
    );
  }
}
