import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

export interface UpdateLocationDateOverrideInput {
  actorUserId: string;
  locationId: string;
  overrideId: string;
  capacity?: number | null;
  fee?: string | null;
}

@Injectable()
export class UpdateLocationDateOverrideUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdateLocationDateOverrideInput) {
    if (input.capacity === undefined && input.fee === undefined) {
      throw new BadRequestException(
        "At least one override field must be provided.",
      );
    }

    return this.unitOfWork.execute(
      async ({ locationDateOverrideRepository, auditLogRepository }) => {
        const override = await locationDateOverrideRepository.findByIdForUpdate(
          input.locationId,
          input.overrideId,
        );

        if (!override) {
          throw new NotFoundException("Location date override not found.");
        }

        const before = {
          capacity: override.capacity,
          fee: override.fee,
        };

        if (input.capacity !== undefined) {
          override.capacity = input.capacity;
        }

        if (input.fee !== undefined) {
          override.fee = input.fee;
        }

        const updated = await locationDateOverrideRepository.save(override);

        const changed =
          before.capacity !== updated.capacity || before.fee !== updated.fee;

        if (changed) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId: input.actorUserId,
              action: AuditAction.LOCATION_DATE_OVERRIDE_UPDATED,
              targetUserId: null,
              metadata: {
                locationId: input.locationId,
                overrideId: updated.id,
                date: updated.date,
                before,
                after: {
                  capacity: updated.capacity,
                  fee: updated.fee,
                },
              },
            }),
          );
        }

        return updated;
      },
    );
  }
}
