import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { Ledger } from "@domain/entities/ledger.entity";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PermitStatus } from "@domain/enums/permit-status.enum";

import {
  addDecimal,
  divideDecimalByInteger,
  isNegativeDecimal,
  isZeroDecimal,
  subtractDecimal,
} from "@domain/utils/decimal.util";

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
      fullName: item.fullName.trim().toLowerCase(),
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
      const initialPermit = await repositories.permitRepository.findById(
        input.permitId,
      );

      if (!initialPermit) {
        throw new NotFoundException("Permit not found.");
      }

      const location = await repositories.locationRepository.findByIdForUpdate(
        initialPermit.locationId,
      );

      if (!location) {
        throw new NotFoundException("Location not found.");
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

      const previousPassengers = permit.passengers;
      const previousVehicles = permit.vehicles;

      if (previousVehicles.length === 0) {
        throw new InternalServerErrorException(
          "The permit has no existing vehicles, so its original vehicle price cannot be determined.",
        );
      }

      const overrides =
        await repositories.locationDateOverrideRepository.findByLocation(
          permit.locationId,
          permit.startDate,
          permit.endDate,
        );

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

      const pricePerVehicle = divideDecimalByInteger(
        permit.totalAmount,
        previousVehicles.length,
      );

      let updatedTotalAmount = "0";

      for (let index = 0; index < vehicles.length; index += 1) {
        updatedTotalAmount = addDecimal(updatedTotalAmount, pricePerVehicle);
      }

      const adjustmentAmount = subtractDecimal(
        updatedTotalAmount,
        permit.totalAmount,
      );

      if (!isZeroDecimal(adjustmentAmount)) {
        const balance =
          await repositories.userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            permit.userId,
            permit.currency,
          );

        if (!balance) {
          throw new InternalServerErrorException(
            "The permit owner's payment balance could not be found.",
          );
        }

        const balanceBefore = balance.amount;
        const additionalCharge = !isNegativeDecimal(adjustmentAmount);

        const absoluteAdjustment = additionalCharge
          ? adjustmentAmount
          : adjustmentAmount.slice(1);

        if (additionalCharge) {
          balance.debit(absoluteAdjustment);
        } else {
          balance.credit(absoluteAdjustment);
        }

        const savedBalance =
          await repositories.userBalanceRepository.save(balance);

        await repositories.ledgerRepository.create(
          Ledger.create({
            userId: permit.userId,
            currency: permit.currency,
            amount: additionalCharge
              ? `-${absoluteAdjustment}`
              : absoluteAdjustment,
            balanceBefore,
            balanceAfter: savedBalance.amount,
            type: additionalCharge
              ? LedgerType.PERMIT_PAYMENT
              : LedgerType.REFUND,
            actorUserId: input.actorUserId,
            referenceId: permit.id,
            metadata: {
              permitId: permit.id,
              reason: input.reason.trim(),
              adjustment: "VEHICLE_COUNT_CHANGED",
              previousVehicleCount: previousVehicles.length,
              vehicleCount: vehicles.length,
              previousTotalAmount: permit.totalAmount,
              totalAmount: updatedTotalAmount,
            },
          }),
        );
      }

      const passengerSnapshots = [];

      for (const item of passengers) {
        const reusablePassenger =
          await repositories.passengerRepository.findByUnique(
            permit.userId,
            item.fullName,
            item.nationalId,
          );

        passengerSnapshots.push({
          id: reusablePassenger?.id ?? null,
          fullName: item.fullName,
          nationalId: item.nationalId,
          isLeader: item.isLeader,
        });
      }

      const vehicleSnapshots = [];

      for (const item of vehicles) {
        const reusableVehicle =
          await repositories.vehicleRepository.findByUnique(
            permit.userId,
            item.kind,
            item.color,
            item.plateId,
          );

        vehicleSnapshots.push({
          id: reusableVehicle?.id ?? null,
          kind: item.kind,
          color: item.color,
          plateId: item.plateId,
        });
      }

      permit.updateTotalAmount(updatedTotalAmount);
      permit.updateParticipants(passengerSnapshots, vehicleSnapshots);

      await repositories.permitRepository.save(permit);

      await repositories.auditLogRepository.create(
        AuditLog.create({
          actorUserId: input.actorUserId,
          targetUserId: permit.userId,
          action: AuditAction.PERMIT_UPDATED,
          metadata: {
            permitId: permit.id,
            reason: input.reason.trim(),
            previousPassengerCount: previousPassengers.length,
            passengerCount: passengerSnapshots.length,
            previousVehicleCount: previousVehicles.length,
            vehicleCount: vehicleSnapshots.length,
            previousTotalAmount: initialPermit.totalAmount,
            totalAmount: updatedTotalAmount,
            adjustmentAmount,
            currency: permit.currency,
          },
        }),
      );

      return {
        id: permit.id,
        status: permit.status,
        totalAmount: permit.totalAmount,
        currency: permit.currency,
        passengers: permit.passengers,
        vehicles: permit.vehicles,
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
