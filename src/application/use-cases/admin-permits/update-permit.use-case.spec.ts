import { AdminUpdatePermitUseCase } from "./update-permit.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PermitStatus } from "@domain/enums/permit-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

describe("AdminUpdatePermitUseCase", () => {
  const permit = {
    id: "permit-1",
    userId: "user-1",
    locationId: "location-1",
    startDate: "2026-11-10",
    endDate: "2026-11-10",
    status: PermitStatus.CONFIRMED,
    totalAmount: "100",
    currency: PaymentCurrency.IRT,
    passengers: [],
    vehicles: [
      { id: "vehicle-1", kind: "Defender", color: "Green", plateId: "111" },
    ],
    updateTotalAmount: jest.fn(function (this: any, amount: string) {
      this.totalAmount = amount;
    }),
    updateParticipants: jest.fn(function (
      this: any,
      passengers: any[],
      vehicles: any[],
    ) {
      this.passengers = passengers;
      this.vehicles = vehicles;
    }),
  };

  const repositories = {
    permitRepository: {
      findById: jest.fn(),
      findByIdForUpdate: jest.fn(),
      countReservedPassengers: jest.fn(),
      save: jest.fn(),
    },
    locationRepository: { findByIdForUpdate: jest.fn() },
    locationDateOverrideRepository: { findByLocation: jest.fn() },
    userBalanceRepository: {
      findByUserIdAndCurrencyForUpdate: jest.fn(),
      save: jest.fn(),
    },
    ledgerRepository: { create: jest.fn() },
    passengerRepository: { findByUnique: jest.fn() },
    vehicleRepository: { findByUnique: jest.fn() },
    auditLogRepository: { create: jest.fn() },
  };

  const unitOfWork = { execute: jest.fn() };
  let useCase: AdminUpdatePermitUseCase;

  const input = {
    permitId: "permit-1",
    actorUserId: "admin-1",
    reason: "Correct participant details",
    passengers: [
      {
        fullName: "Reza Khaleghi",
        nationalId: "1234567890",
        isLeader: true,
      },
    ],
    vehicles: [
      {
        kind: "Land Rover Defender",
        color: "Green",
        plateId: "12A345-IR",
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    permit.status = PermitStatus.CONFIRMED;
    permit.totalAmount = "100";
    permit.vehicles = [
      { id: "vehicle-1", kind: "Defender", color: "Green", plateId: "111" },
    ];
    permit.passengers = [];

    unitOfWork.execute.mockImplementation((callback: any) =>
      callback(repositories),
    );

    repositories.permitRepository.findById.mockResolvedValue(permit);
    repositories.permitRepository.findByIdForUpdate.mockResolvedValue(permit);

    repositories.locationRepository.findByIdForUpdate.mockResolvedValue({
      id: "location-1",
      capacity: 10,
    });

    repositories.locationDateOverrideRepository.findByLocation.mockResolvedValue(
      [],
    );

    repositories.permitRepository.countReservedPassengers.mockResolvedValue(0);
    repositories.passengerRepository.findByUnique.mockResolvedValue(null);
    repositories.vehicleRepository.findByUnique.mockResolvedValue(null);
    repositories.permitRepository.save.mockResolvedValue(permit);

    useCase = new AdminUpdatePermitUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("validates required reason, passengers, leader and vehicles", async () => {
    await expect(
      useCase.execute({ ...input, reason: " " }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({ ...input, passengers: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({
        ...input,
        passengers: [{ ...input.passengers[0], isLeader: false }],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({ ...input, vehicles: [] }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it("rejects duplicate passenger national IDs and vehicle plate IDs", async () => {
    await expect(
      useCase.execute({
        ...input,
        passengers: [
          input.passengers[0],
          { ...input.passengers[0], fullName: "Another Person" },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      useCase.execute({
        ...input,
        vehicles: [
          input.vehicles[0],
          { ...input.vehicles[0], kind: "Another vehicle" },
        ],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("updates snapshots and reuses matching master records without creating them", async () => {
    repositories.passengerRepository.findByUnique.mockResolvedValue({
      id: "passenger-1",
    });

    repositories.vehicleRepository.findByUnique.mockResolvedValue({
      id: "vehicle-2",
    });

    const result = await useCase.execute(input);

    expect(repositories.passengerRepository.findByUnique).toHaveBeenCalledWith(
      "user-1",
      "reza khaleghi",
      "1234567890",
    );

    expect(repositories.vehicleRepository.findByUnique).toHaveBeenCalledWith(
      "user-1",
      "Land Rover Defender",
      "Green",
      "12A345-IR",
    );

    expect(permit.updateParticipants).toHaveBeenCalledWith(
      [
        {
          id: "passenger-1",
          fullName: "reza khaleghi",
          nationalId: "1234567890",
          isLeader: true,
        },
      ],
      [
        {
          id: "vehicle-2",
          kind: "Land Rover Defender",
          color: "Green",
          plateId: "12A345-IR",
        },
      ],
    );

    expect(repositories.permitRepository.save).toHaveBeenCalledWith(permit);
    expect(repositories.auditLogRepository.create).toHaveBeenCalledTimes(1);
    expect(result.passengers[0].id).toBe("passenger-1");
  });

  it("rejects updates when the permit is not confirmed", async () => {
    permit.status = PermitStatus.ENDED;

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it("throws when the permit does not exist", async () => {
    repositories.permitRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it("throws when the permit has no existing vehicles", async () => {
    permit.vehicles = [];

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
  });

  it("rejects updates that exceed location capacity", async () => {
    repositories.permitRepository.countReservedPassengers.mockResolvedValue(10);

    await expect(useCase.execute(input)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
