import { UpdateVehicleUseCase } from "./update-vehicle.use-case";
import { Vehicle } from "@domain/entities/vehicle.entity";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";

describe("UpdateVehicleUseCase", () => {
  const vehicleRepositoryMock = {
    findByIdForUser: jest.fn(),
    findByUnique: jest.fn(),
    save: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: UpdateVehicleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ vehicleRepository: vehicleRepositoryMock }),
    );

    useCase = new UpdateVehicleUseCase(unitOfWorkMock as unknown as UnitOfWork);
  });

  const createVehicle = () =>
    Vehicle.create({
      id: "vehicle-1",
      userId: "user-1",
      kind: "Old",
      color: "Red",
      plateId: "111",
    });

  it("updates vehicle details after trimming them", async () => {
    const vehicle = createVehicle();

    vehicleRepositoryMock.findByIdForUser.mockResolvedValue(vehicle);
    vehicleRepositoryMock.findByUnique.mockResolvedValue(null);
    vehicleRepositoryMock.save.mockImplementation(async (value) => value);

    const result = await useCase.execute({
      id: "vehicle-1",
      userId: "user-1",
      kind: " Land Rover Defender ",
      color: " Green ",
      plateId: " 12A345-IR ",
    });

    expect(vehicleRepositoryMock.findByUnique).toHaveBeenCalledWith(
      "user-1",
      "Land Rover Defender",
      "Green",
      "12A345-IR",
    );
    expect(result).toMatchObject({
      id: "vehicle-1",
      kind: "Land Rover Defender",
      color: "Green",
      plateId: "12A345-IR",
    });
    expect(vehicleRepositoryMock.save).toHaveBeenCalledWith(vehicle);
  });

  it("does not reject the vehicle's unchanged unique details", async () => {
    const vehicle = createVehicle();

    vehicleRepositoryMock.findByIdForUser.mockResolvedValue(vehicle);
    vehicleRepositoryMock.findByUnique.mockResolvedValue(vehicle);
    vehicleRepositoryMock.save.mockImplementation(async (value) => value);

    await expect(
      useCase.execute({
        id: vehicle.id,
        userId: "user-1",
        kind: "Old",
        color: "Red",
        plateId: "111",
      }),
    ).resolves.toMatchObject({
      id: vehicle.id,
      kind: "Old",
      color: "Red",
      plateId: "111",
    });
  });

  it("throws when the vehicle does not belong to the user", async () => {
    vehicleRepositoryMock.findByIdForUser.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: "vehicle-1",
        userId: "user-1",
        kind: "Defender",
        color: "Green",
        plateId: "123",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(vehicleRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("rejects duplicate vehicle details", async () => {
    const vehicle = createVehicle();

    vehicleRepositoryMock.findByIdForUser.mockResolvedValue(vehicle);
    vehicleRepositoryMock.findByUnique.mockResolvedValue({
      id: "another-vehicle",
    });

    await expect(
      useCase.execute({
        id: vehicle.id,
        userId: "user-1",
        kind: "Defender",
        color: "Green",
        plateId: "222",
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(vehicleRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("rejects empty vehicle details", async () => {
    await expect(
      useCase.execute({
        id: "vehicle-1",
        userId: "user-1",
        kind: " ",
        color: "Green",
        plateId: "123",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
  });
});
