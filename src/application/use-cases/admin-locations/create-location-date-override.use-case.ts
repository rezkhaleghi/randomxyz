import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

export interface CreateLocationDateOverrideInput {
  actorUserId: string;
  locationId: string;
  date: string;
  capacity?: number;
  fee?: string;
}

@Injectable()
export class CreateLocationDateOverrideUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreateLocationDateOverrideInput) {
    if (input.capacity === undefined && input.fee === undefined) {
      throw new BadRequestException(
        "At least one of capacity or fee must be provided.",
      );
    }

    return this.unitOfWork.execute(
      async ({
        locationRepository,
        locationDateOverrideRepository,
        auditLogRepository,
      }) => {
        const location = await locationRepository.findByIdForUpdate(
          input.locationId,
        );

        if (!location) {
          throw new NotFoundException("Location not found.");
        }

        const created = await locationDateOverrideRepository.create({
          locationId: input.locationId,
          date: input.date,
          capacity: input.capacity ?? null,
          fee: input.fee ?? null,
        });

        await auditLogRepository.create(
          AuditLog.create({
            actorUserId: input.actorUserId,
            action: AuditAction.LOCATION_DATE_OVERRIDE_CREATED,
            targetUserId: null,
            metadata: {
              locationId: input.locationId,
              overrideId: created.id,
              date: created.date,
              capacity: created.capacity,
              fee: created.fee,
            },
          }),
        );

        return created;
      },
    );
  }
}
