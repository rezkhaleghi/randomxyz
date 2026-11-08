import { DeleteVehicleUseCase } from "./delete-vehicle.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { NotFoundException } from "@nestjs/common";

describe("DeleteVehicleUseCase", () => {
  const vehicleRepositoryMock = {
    deleteByIdForUser: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: DeleteVehicleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ vehicleRepository: vehicleRepositoryMock }),
    );

    useCase = new DeleteVehicleUseCase(unitOfWorkMock as unknown as UnitOfWork);
  });

  it("deletes a vehicle belonging to the user", async () => {
    vehicleRepositoryMock.deleteByIdForUser.mockResolvedValue(true);

    await expect(
      useCase.execute({ id: "vehicle-1", userId: "user-1" }),
    ).resolves.toEqual({ success: true });

    expect(vehicleRepositoryMock.deleteByIdForUser).toHaveBeenCalledWith(
      "vehicle-1",
      "user-1",
    );
  });

  it("throws when the vehicle does not exist or does not belong to the user", async () => {
    vehicleRepositoryMock.deleteByIdForUser.mockResolvedValue(false);

    await expect(
      useCase.execute({ id: "vehicle-1", userId: "user-1" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
