import { CreateVehicleUseCase } from "./create-vehicle.use-case";
import { Vehicle } from "@domain/entities/vehicle.entity";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("CreateVehicleUseCase", () => {
  const vehicleRepositoryMock = {
    createIfNotExists: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: CreateVehicleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ vehicleRepository: vehicleRepositoryMock }),
    );

    useCase = new CreateVehicleUseCase(unitOfWorkMock as unknown as UnitOfWork);
  });

  it("creates or reuses a vehicle with trimmed details", async () => {
    const vehicle = Vehicle.create({
      id: "vehicle-1",
      userId: "user-1",
      kind: "Land Rover Defender",
      color: "Green",
      plateId: "12A345-IR",
    });

    vehicleRepositoryMock.createIfNotExists.mockResolvedValue(vehicle);

    const result = await useCase.execute({
      userId: "user-1",
      kind: " Land Rover Defender ",
      color: " Green ",
      plateId: " 12A345-IR ",
    });

    expect(vehicleRepositoryMock.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        kind: "Land Rover Defender",
        color: "Green",
        plateId: "12A345-IR",
      }),
    );

    expect(result).toEqual({
      id: vehicle.id,
      kind: vehicle.kind,
      color: vehicle.color,
      plateId: vehicle.plateId,
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    });
  });

  it.each([
    { kind: "", color: "Green", plateId: "123" },
    { kind: "Defender", color: "", plateId: "123" },
    { kind: "Defender", color: "Green", plateId: "" },
  ])("rejects invalid vehicle details: %j", async (input) => {
    await expect(
      useCase.execute({ userId: "user-1", ...input }),
    ).rejects.toThrow("Invalid vehicle information.");

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
  });
});
