import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { AuditLog } from "@domain/entities/audit-log.entity";
import { AuditAction } from "@domain/enums/audit-action.enum";

export interface UpsertLocationDateOverrideInput {
  actorUserId: string;
  locationId: string;
  date: string;
  capacity?: number | null;
  fee?: string | null;
}

@Injectable()
export class UpsertLocationDateOverrideUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpsertLocationDateOverrideInput) {
    if (input.capacity === undefined && input.fee === undefined) {
      throw new BadRequestException(
        "At least one of capacity or fee must be provided.",
      );
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(input.date) ||
      new Date(`${input.date}T00:00:00.000Z`).toISOString().slice(0, 10) !==
        input.date
    ) {
      throw new BadRequestException("Invalid date. Expected YYYY-MM-DD.");
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

        const existing =
          await locationDateOverrideRepository.findByLocationAndDate(
            input.locationId,
            input.date,
          );

        if (!existing) {
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
        }

        const before = {
          capacity: existing.capacity,
          fee: existing.fee,
        };

        if (input.capacity !== undefined) {
          existing.capacity = input.capacity;
        }

        if (input.fee !== undefined) {
          existing.fee = input.fee;
        }

        const updated = await locationDateOverrideRepository.save(existing);

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
