import { randomBytes } from "crypto";

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { Ledger } from "@domain/entities/ledger.entity";
import { Passenger } from "@domain/entities/passenger.entity";
import { Permit } from "@domain/entities/permit.entity";
import { Vehicle } from "@domain/entities/vehicle.entity";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

import { InsufficientBalanceException } from "@domain/exceptions/domain.exception";
import {
  addDecimal,
  isNegativeDecimal,
  isZeroDecimal,
} from "@domain/utils/decimal.util";

export interface CreatePermitInput {
  userId: string;
  locationId: string;
  startDate: string;
  endDate: string;
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
export class CreatePermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreatePermitInput) {
    this.validateInput(input);

    const passengers = input.passengers.map((passenger) => ({
      ...passenger,
      fullName: passenger.fullName.trim().toLowerCase(),
      nationalId: passenger.nationalId.trim(),
    }));

    const vehicles = input.vehicles.map((vehicle) => ({
      ...vehicle,
      kind: vehicle.kind.trim(),
      color: vehicle.color.trim(),
      plateId: vehicle.plateId.trim(),
    }));

    this.validateUniqueValues(
      passengers.map((passenger) => passenger.nationalId),
      "Passenger national IDs",
    );

    this.validateUniqueValues(
      vehicles.map((vehicle) => vehicle.plateId),
      "Vehicle plate IDs",
    );

    this.validateDateRange(input.startDate, input.endDate);

    return this.unitOfWork.execute(async (repositories) => {
      const {
        locationRepository,
        locationDateOverrideRepository,
        permitSettingsRepository,
        permitRepository,
        passengerRepository,
        vehicleRepository,
        userBalanceRepository,
        ledgerRepository,
        auditLogRepository,
      } = repositories;

      const location = await locationRepository.findByIdForUpdate(
        input.locationId,
      );

      if (!location || !location.isAvailable || !location.isEnabled) {
        throw new NotFoundException("Location not found.");
      }

      const [settings, overrides] = await Promise.all([
        permitSettingsRepository.findOrCreate(),
        locationDateOverrideRepository.findByLocation(
          input.locationId,
          input.startDate,
          input.endDate,
        ),
      ]);

      const overridesByDate = new Map(
        overrides.map((override) => [override.date, override]),
      );

      const today = this.getTodayDate();
      const passengerCount = passengers.length;
      const vehicleCount = vehicles.length;

      let totalAmount = "0";
      let currentDate = input.startDate;

      while (currentDate <= input.endDate) {
        const override = overridesByDate.get(currentDate);
        const capacity = override?.capacity ?? location.capacity;

        const reservedCapacity = await permitRepository.countReservedPassengers(
          location.id,
          currentDate,
          today,
        );

        if (reservedCapacity + passengerCount > capacity) {
          throw new ConflictException(
            `Not enough capacity for ${currentDate}. Remaining capacity: ${Math.max(
              0,
              capacity - reservedCapacity,
            )}.`,
          );
        }

        const feePerVehicle =
          override?.fee ?? location.fee ?? settings.defaultFee;

        if (isNegativeDecimal(feePerVehicle)) {
          throw new BadRequestException(
            `Invalid permit fee configured for ${currentDate}.`,
          );
        }

        for (let index = 0; index < vehicleCount; index += 1) {
          totalAmount = addDecimal(totalAmount, feePerVehicle);
        }

        currentDate = this.addDays(currentDate, 1);
      }

      if (isNegativeDecimal(totalAmount)) {
        throw new BadRequestException("Invalid permit amount.");
      }

      const permitPassengers = [];

      for (const passenger of passengers) {
        const reusablePassenger = await passengerRepository.createIfNotExists(
          Passenger.create({
            userId: input.userId,
            fullName: passenger.fullName,
            nationalId: passenger.nationalId,
          }),
        );

        permitPassengers.push({
          id: reusablePassenger.id,
          fullName: passenger.fullName,
          nationalId: passenger.nationalId,
          isLeader: passenger.isLeader,
        });
      }

      const permitVehicles = [];

      for (const vehicle of vehicles) {
        const reusableVehicle = await vehicleRepository.createIfNotExists(
          Vehicle.create({
            userId: input.userId,
            kind: vehicle.kind,
            color: vehicle.color,
            plateId: vehicle.plateId,
          }),
        );

        permitVehicles.push({
          id: reusableVehicle.id,
          kind: vehicle.kind,
          color: vehicle.color,
          plateId: vehicle.plateId,
        });
      }

      const permit = Permit.create({
        userId: input.userId,
        locationId: location.id,
        startDate: input.startDate,
        endDate: input.endDate,
        totalAmount,
        currency: PaymentCurrency.IRT,
        qrToken: randomBytes(32).toString("hex"),
        passengers: permitPassengers,
        vehicles: permitVehicles,
      });

      if (!isZeroDecimal(totalAmount)) {
        const balance =
          await userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            input.userId,
            PaymentCurrency.IRT,
          );

        if (!balance) {
          throw new InsufficientBalanceException();
        }

        const balanceBefore = balance.amount;

        balance.debit(totalAmount);

        await userBalanceRepository.save(balance);

        await ledgerRepository.create(
          Ledger.create({
            userId: input.userId,
            currency: PaymentCurrency.IRT,
            amount: `-${totalAmount}`,
            balanceBefore,
            balanceAfter: balance.amount,
            type: LedgerType.PERMIT_PAYMENT,
            referenceId: permit.id,
            metadata: {
              locationId: location.id,
              startDate: input.startDate,
              endDate: input.endDate,
              vehicleCount,
              passengerCount,
            },
          }),
        );
      }

      await permitRepository.create(permit);

      await auditLogRepository.create(
        AuditLog.create({
          actorUserId: input.userId,
          targetUserId: input.userId,
          action: AuditAction.PERMIT_CREATED,
          metadata: {
            permitId: permit.id,
            locationId: location.id,
            startDate: input.startDate,
            endDate: input.endDate,
            passengerCount,
            vehicleCount,
            totalAmount,
            currency: PaymentCurrency.IRT,
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
        qrToken: permit.qrToken,
        passengers: permit.passengers,
        vehicles: permit.vehicles,
        createdAt: permit.createdAt,
      };
    });
  }

  private validateInput(input: CreatePermitInput): void {
    if (!input.passengers?.length) {
      throw new BadRequestException("At least one passenger is required.");
    }

    if (!input.passengers.some((passenger) => passenger.isLeader)) {
      throw new BadRequestException("At least one passenger must be a leader.");
    }

    if (!input.vehicles?.length) {
      throw new BadRequestException("At least one vehicle is required.");
    }

    for (const passenger of input.passengers) {
      if (
        !passenger.fullName?.trim() ||
        !passenger.nationalId?.trim() ||
        typeof passenger.isLeader !== "boolean"
      ) {
        throw new BadRequestException("Invalid passenger information.");
      }
    }

    for (const vehicle of input.vehicles) {
      if (
        !vehicle.kind?.trim() ||
        !vehicle.color?.trim() ||
        !vehicle.plateId?.trim()
      ) {
        throw new BadRequestException("Invalid vehicle information.");
      }
    }
  }

  private validateUniqueValues(values: string[], label: string): void {
    if (new Set(values).size !== values.length) {
      throw new BadRequestException(`${label} must be unique within a permit.`);
    }
  }

  private validateDateRange(startDate: string, endDate: string): void {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new BadRequestException("Invalid permit date range.");
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        "startDate must be before or equal to endDate.",
      );
    }

    const today = this.getTodayDate();
    const maximumDate = this.addMonths(today, 12);

    if (startDate < today) {
      throw new BadRequestException("A permit cannot start in the past.");
    }

    if (endDate > maximumDate) {
      throw new BadRequestException(
        "The permit exceeds the 12-month booking horizon.",
      );
    }
  }

  private isValidDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);

    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
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

  private addMonths(value: string, months: number): string {
    const [year, month, day] = value.split("-").map(Number);

    const targetYear = year + Math.floor((month - 1 + months) / 12);
    const targetMonth = ((month - 1 + months) % 12) + 1;

    const lastDayOfMonth = new Date(
      Date.UTC(targetYear, targetMonth, 0),
    ).getUTCDate();

    const targetDay = Math.min(day, lastDayOfMonth);

    return [
      targetYear,
      String(targetMonth).padStart(2, "0"),
      String(targetDay).padStart(2, "0"),
    ].join("-");
  }
}
