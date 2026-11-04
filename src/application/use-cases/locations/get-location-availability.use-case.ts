import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { addDecimal, isNegativeDecimal } from "@domain/utils/decimal.util";

export interface GetLocationAvailabilityInput {
  locationId: string;
  startDate: string;
  endDate: string;
  vehicleCount: number;
  passengerCount: number;
}

@Injectable()
export class GetLocationAvailabilityUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: GetLocationAvailabilityInput) {
    this.validateDateRange(input.startDate, input.endDate);

    if (!Number.isInteger(input.vehicleCount) || input.vehicleCount < 1) {
      throw new BadRequestException("vehicleCount must be a positive integer.");
    }

    if (!Number.isInteger(input.passengerCount) || input.passengerCount < 1) {
      throw new BadRequestException(
        "passengerCount must be a positive integer.",
      );
    }

    return this.unitOfWork.execute(
      async ({
        locationRepository,
        locationDateOverrideRepository,
        permitSettingsRepository,
        permitRepository,
      }) => {
        const location = await locationRepository.findAvailableById(
          input.locationId,
        );

        if (!location) {
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

        const days = [];
        let totalEstimatedFee = "0";
        let currentDate = input.startDate;

        while (currentDate <= input.endDate) {
          const override = overridesByDate.get(currentDate);

          const capacity = override?.capacity ?? location.capacity;

          const feePerVehicle =
            override?.fee ?? location.fee ?? settings.defaultFee;

          if (isNegativeDecimal(feePerVehicle)) {
            throw new BadRequestException(
              `Invalid permit fee configured for ${currentDate}.`,
            );
          }

          const reservedCapacity =
            await permitRepository.countReservedPassengers(
              location.id,
              currentDate,
              today,
            );

          const remainingCapacity = Math.max(0, capacity - reservedCapacity);

          const estimatedFee = this.calculateDailyFee(
            feePerVehicle,
            input.vehicleCount,
          );

          const isAvailable = remainingCapacity >= input.passengerCount;

          days.push({
            date: currentDate,
            feePerVehicle,
            vehicleCount: input.vehicleCount,
            passengerCount: input.passengerCount,
            estimatedFee,
            capacity,
            reservedCapacity,
            remainingCapacity,
            isAvailable,
          });

          totalEstimatedFee = addDecimal(totalEstimatedFee, estimatedFee);

          currentDate = this.addDays(currentDate, 1);
        }

        return {
          locationId: location.id,
          startDate: input.startDate,
          endDate: input.endDate,
          vehicleCount: input.vehicleCount,
          passengerCount: input.passengerCount,
          currency: "IRT",
          isRangeAvailable: days.every((day) => day.isAvailable),
          totalEstimatedFee,
          days,
        };
      },
    );
  }

  private calculateDailyFee(
    feePerVehicle: string,
    vehicleCount: number,
  ): string {
    let total = "0";

    for (let index = 0; index < vehicleCount; index += 1) {
      total = addDecimal(total, feePerVehicle);
    }

    return total;
  }

  private validateDateRange(startDate: string, endDate: string): void {
    if (!this.isValidDate(startDate) || !this.isValidDate(endDate)) {
      throw new BadRequestException("Invalid date range.");
    }

    if (startDate > endDate) {
      throw new BadRequestException(
        "startDate must be before or equal to endDate.",
      );
    }

    const today = this.getTodayDate();
    const maximumDate = this.addMonths(today, 12);

    if (startDate < today) {
      throw new BadRequestException(
        "Availability cannot be requested for past dates.",
      );
    }

    if (endDate > maximumDate) {
      throw new BadRequestException(
        "The requested date range exceeds the 12-month booking horizon.",
      );
    }

    const duration =
      (this.toUtcTimestamp(endDate) - this.toUtcTimestamp(startDate)) /
        86_400_000 +
      1;

    if (duration > 31) {
      throw new BadRequestException(
        "The availability date range cannot exceed 31 days.",
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

  private toUtcTimestamp(value: string): number {
    return new Date(`${value}T00:00:00.000Z`).getTime();
  }
}
