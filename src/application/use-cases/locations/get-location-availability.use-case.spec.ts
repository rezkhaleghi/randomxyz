import { GetLocationAvailabilityUseCase } from "./get-location-availability.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("GetLocationAvailabilityUseCase", () => {
  const repositories = {
    locationRepository: { findAvailableById: jest.fn() },
    locationDateOverrideRepository: { findByLocation: jest.fn() },
    permitSettingsRepository: { findOrCreate: jest.fn() },
    permitRepository: { countReservedPassengers: jest.fn() },
  };
  const unitOfWork = { execute: jest.fn() };
  let useCase: GetLocationAvailabilityUseCase;

  const input = {
    locationId: "location-1",
    startDate: "2026-11-10",
    endDate: "2026-11-10",
    vehicleCount: 2,
    passengerCount: 3,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback(repositories),
    );
    repositories.locationRepository.findAvailableById.mockResolvedValue({
      id: "location-1",
      capacity: 10,
      fee: "100",
    });
    repositories.permitSettingsRepository.findOrCreate.mockResolvedValue({
      defaultFee: "500",
    });
    repositories.locationDateOverrideRepository.findByLocation.mockResolvedValue(
      [],
    );
    repositories.permitRepository.countReservedPassengers.mockResolvedValue(2);

    useCase = new GetLocationAvailabilityUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it("calculates daily fees and remaining capacity", async () => {
    const result = await useCase.execute(input);

    expect(result).toMatchObject({
      locationId: "location-1",
      currency: "IRT",
      isRangeAvailable: true,
      totalEstimatedFee: "200",
    });
    expect(result.days).toHaveLength(1);
    expect(result.days[0]).toMatchObject({
      feePerVehicle: "100",
      vehicleCount: 2,
      passengerCount: 3,
      estimatedFee: "200",
      capacity: 10,
      reservedCapacity: 2,
      remainingCapacity: 8,
      isAvailable: true,
    });
  });

  it("uses date overrides for capacity and fee", async () => {
    repositories.locationDateOverrideRepository.findByLocation.mockResolvedValue(
      [{ date: "2026-11-10", capacity: 4, fee: "50" }],
    );

    const result = await useCase.execute(input);

    expect(result.days[0]).toMatchObject({
      capacity: 4,
      feePerVehicle: "50",
      estimatedFee: "100",
    });
  });

  it("returns unavailable when remaining capacity is insufficient", async () => {
    repositories.permitRepository.countReservedPassengers.mockResolvedValue(9);

    const result = await useCase.execute(input);

    expect(result.isRangeAvailable).toBe(false);
    expect(result.days[0].remainingCapacity).toBe(1);
    expect(result.days[0].isAvailable).toBe(false);
  });

  it("rejects invalid date ranges", async () => {
    await expect(
      useCase.execute({
        ...input,
        startDate: "2026-11-20",
        endDate: "2026-11-10",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({ ...input, startDate: "invalid" }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it("rejects past dates", async () => {
    await expect(
      useCase.execute({
        ...input,
        startDate: "2020-01-01",
        endDate: "2020-01-01",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects date ranges longer than 31 days", async () => {
    await expect(
      useCase.execute({
        ...input,
        startDate: "2026-11-10",
        endDate: "2026-12-11",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects invalid passenger and vehicle counts", async () => {
    await expect(
      useCase.execute({ ...input, vehicleCount: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({ ...input, passengerCount: 0 }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("throws when the location is unavailable", async () => {
    repositories.locationRepository.findAvailableById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
