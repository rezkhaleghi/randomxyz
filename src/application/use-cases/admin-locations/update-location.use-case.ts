import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface UpdateLocationInput {
  actorUserId: string;
  id: string;
  isEnabled?: boolean;
  capacity?: number;
  fee?: string | null;
}

@Injectable()
export class UpdateLocationUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdateLocationInput) {
    if (
      input.isEnabled === undefined &&
      input.capacity === undefined &&
      input.fee === undefined
    ) {
      throw new BadRequestException(
        "At least one location setting must be provided.",
      );
    }

    return this.unitOfWork.execute(
      async ({ locationRepository, auditLogRepository }) => {
        const location = await locationRepository.findByIdForUpdate(input.id);

        if (!location) {
          throw new NotFoundException("Location not found.");
        }

        const updated = await locationRepository.save({
          ...location,
          isEnabled: input.isEnabled ?? location.isEnabled,
          capacity: input.capacity ?? location.capacity,
          fee: input.fee === undefined ? location.fee : input.fee,
        });

        const changed =
          updated.isEnabled !== location.isEnabled ||
          updated.capacity !== location.capacity ||
          updated.fee !== location.fee;

        if (changed) {
          await auditLogRepository.create(
            AuditLog.create({
              actorUserId: input.actorUserId,
              action: AuditAction.LOCATION_SETTINGS_UPDATED,
              targetUserId: null,
              metadata: {
                locationId: updated.id,
                externalId: updated.externalId,
                before: {
                  isEnabled: location.isEnabled,
                  capacity: location.capacity,
                  fee: location.fee,
                },
                after: {
                  isEnabled: updated.isEnabled,
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
