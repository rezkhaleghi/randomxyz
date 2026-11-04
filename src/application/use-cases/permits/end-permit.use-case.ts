import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { PermitStatus } from "@domain/enums/permit-status.enum";
import { AuditAction } from "@domain/enums/audit-action.enum";

export interface EndPermitInput {
  userId: string;
  permitId: string;
}

@Injectable()
export class EndPermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: EndPermitInput) {
    return this.unitOfWork.execute(async (repositories) => {
      const { permitRepository, locationRepository, auditLogRepository } =
        repositories;

      const existingPermit = await permitRepository.findById(input.permitId);

      if (!existingPermit || existingPermit.userId !== input.userId) {
        throw new NotFoundException("Permit not found.");
      }

      // Use the same lock order as permit creation to serialize
      // bookings and permit endings for a location.
      const location = await locationRepository.findByIdForUpdate(
        existingPermit.locationId,
      );

      if (!location) {
        throw new NotFoundException("Location not found.");
      }

      const permit = await permitRepository.findByIdForUpdate(input.permitId);

      if (!permit || permit.userId !== input.userId) {
        throw new NotFoundException("Permit not found.");
      }

      if (
        permit.status !== PermitStatus.CONFIRMED &&
        permit.status !== PermitStatus.EXPIRED
      ) {
        throw new ConflictException(
          `A permit with status ${permit.status} cannot be ended.`,
        );
      }

      const previousStatus = permit.status;

      permit.end();

      await permitRepository.save(permit);

      await auditLogRepository.create(
        AuditLog.create({
          actorUserId: input.userId,
          targetUserId: input.userId,
          action: AuditAction.PERMIT_ENDED,
          metadata: {
            permitId: permit.id,
            locationId: permit.locationId,
            startDate: permit.startDate,
            endDate: permit.endDate,
            previousStatus,
            newStatus: permit.status,
          },
        }),
      );

      return {
        id: permit.id,
        locationId: permit.locationId,
        startDate: permit.startDate,
        endDate: permit.endDate,
        status: permit.status,
        totalAmount: permit.totalAmount,
        currency: permit.currency,
        updatedAt: permit.updatedAt,
      };
    });
  }
}
