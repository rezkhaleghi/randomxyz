import { DeletePassengerUseCase } from "./delete-passenger.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { NotFoundException } from "@nestjs/common";

describe("DeletePassengerUseCase", () => {
  const passengerRepositoryMock = {
    deleteByIdForUser: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: DeletePassengerUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ passengerRepository: passengerRepositoryMock }),
    );

    useCase = new DeletePassengerUseCase(
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  it("deletes a passenger belonging to the user", async () => {
    passengerRepositoryMock.deleteByIdForUser.mockResolvedValue(true);

    await expect(
      useCase.execute({ id: "passenger-1", userId: "user-1" }),
    ).resolves.toEqual({ success: true });

    expect(passengerRepositoryMock.deleteByIdForUser).toHaveBeenCalledWith(
      "passenger-1",
      "user-1",
    );
  });

  it("throws when the passenger does not exist or does not belong to the user", async () => {
    passengerRepositoryMock.deleteByIdForUser.mockResolvedValue(false);

    await expect(
      useCase.execute({ id: "passenger-1", userId: "user-1" }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
