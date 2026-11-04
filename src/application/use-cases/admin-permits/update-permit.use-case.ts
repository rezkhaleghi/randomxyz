import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { Passenger } from "@domain/entities/passenger.entity";
import { Vehicle } from "@domain/entities/vehicle.entity";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { PermitStatus } from "@domain/enums/permit-status.enum";

export interface UpdatePermitInput {
  permitId: string;
  actorUserId: string;
  reason: string;
  passengers: {
    fullName: string;
    nationalId: string;
    isLeader: boolean;
  }[];
  vehicles: {
    kind: string;
    color: string;
    plateId: string;
  }[];
}

@Injectable()
export class AdminUpdatePermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdatePermitInput) {
    this.validate(input);

    const passengers = input.passengers.map((item) => ({
      ...item,
      fullName: item.fullName.trim(),
      nationalId: item.nationalId.trim(),
    }));

    const vehicles = input.vehicles.map((item) => ({
      ...item,
      kind: item.kind.trim(),
      color: item.color.trim(),
      plateId: item.plateId.trim(),
    }));

    this.assertUnique(
      passengers.map((item) => item.nationalId),
      "National IDs",
    );
    this.assertUnique(
      vehicles.map((item) => item.plateId),
      "Plate IDs",
    );

    return this.unitOfWork.execute(async (repositories) => {
      const location = await repositories.locationRepository.findByIdForUpdate(
        (await repositories.permitRepository.findById(input.permitId))
          ?.locationId ?? "",
      );

      const initialPermit = await repositories.permitRepository.findById(
        input.permitId,
      );

      if (!initialPermit || !location) {
        throw new NotFoundException("Permit not found.");
      }

      const permit = await repositories.permitRepository.findByIdForUpdate(
        input.permitId,
      );

      if (!permit) {
        throw new NotFoundException("Permit not found.");
      }

      if (permit.status !== PermitStatus.CONFIRMED) {
        throw new ConflictException("Only confirmed permits can be updated.");
      }

      const [previousPassengers, previousVehicles] = await Promise.all([
        repositories.passengerRepository.findByPermitId(permit.id),
        repositories.vehicleRepository.findByPermitId(permit.id),
      ]);

      const [settings, overrides] = await Promise.all([
        repositories.permitSettingsRepository.findOrCreate(),
        repositories.locationDateOverrideRepository.findByLocation(
          permit.locationId,
          permit.startDate,
          permit.endDate,
        ),
      ]);

      const overridesByDate = new Map(
        overrides.map((override) => [override.date, override]),
      );

      const today = this.getTodayDate();
      let currentDate = permit.startDate;

      while (currentDate <= permit.endDate) {
        const override = overridesByDate.get(currentDate);
        const capacity = override?.capacity ?? location.capacity;

        const reserved =
          await repositories.permitRepository.countReservedPassengers(
            permit.locationId,
            currentDate,
            today,
            permit.id,
          );

        if (reserved + passengers.length > capacity) {
          throw new ConflictException(
            `Not enough capacity for ${currentDate}. Remaining capacity: ${Math.max(
              0,
              capacity - reserved,
            )}.`,
          );
        }

        currentDate = this.addDays(currentDate, 1);
      }

      await repositories.passengerRepository.deleteByPermitId(permit.id);
      await repositories.vehicleRepository.deleteByPermitId(permit.id);

      const savedPassengers = await repositories.passengerRepository.createMany(
        passengers.map((item) =>
          Passenger.create({
            permitId: permit.id,
            fullName: item.fullName,
            nationalId: item.nationalId,
            isLeader: item.isLeader,
          }),
        ),
      );

      const savedVehicles = await repositories.vehicleRepository.createMany(
        vehicles.map((item) =>
          Vehicle.create({
            permitId: permit.id,
            kind: item.kind,
            color: item.color,
            plateId: item.plateId,
          }),
        ),
      );

      await repositories.auditLogRepository.create(
        AuditLog.create({
          actorUserId: input.actorUserId,
          targetUserId: permit.userId,
          action: AuditAction.PERMIT_UPDATED,
          metadata: {
            permitId: permit.id,
            reason: input.reason.trim(),
            previousPassengerCount: previousPassengers.length,
            passengerCount: savedPassengers.length,
            previousVehicleCount: previousVehicles.length,
            vehicleCount: savedVehicles.length,
          },
        }),
      );

      return {
        id: permit.id,
        status: permit.status,
        passengers: savedPassengers,
        vehicles: savedVehicles,
      };
    });
  }

  private validate(input: UpdatePermitInput): void {
    if (!input.reason?.trim()) {
      throw new BadRequestException("A reason is required.");
    }

    if (!input.passengers?.length) {
      throw new BadRequestException("At least one passenger is required.");
    }

    if (!input.passengers.some((item) => item.isLeader)) {
      throw new BadRequestException("At least one passenger must be a leader.");
    }

    if (!input.vehicles?.length) {
      throw new BadRequestException("At least one vehicle is required.");
    }

    for (const item of input.passengers) {
      if (
        !item.fullName?.trim() ||
        !item.nationalId?.trim() ||
        typeof item.isLeader !== "boolean"
      ) {
        throw new BadRequestException("Invalid passenger information.");
      }
    }

    for (const item of input.vehicles) {
      if (!item.kind?.trim() || !item.color?.trim() || !item.plateId?.trim()) {
        throw new BadRequestException("Invalid vehicle information.");
      }
    }
  }

  private assertUnique(values: string[], label: string): void {
    if (new Set(values).size !== values.length) {
      throw new BadRequestException(`${label} must be unique within a permit.`);
    }
  }

  private getTodayDate(): string {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      throw new Error("Could not determine the current Tehran date.");
    }

    return `${year}-${month}-${day}`;
  }

  private addDays(value: string, days: number): string {
    const [year, month, day] = value.split("-").map(Number);

    return new Date(Date.UTC(year, month - 1, day + days))
      .toISOString()
      .slice(0, 10);
  }
}
