import { CreatePassengerUseCase } from "./create-passenger.use-case";
import { Passenger } from "@domain/entities/passenger.entity";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("CreatePassengerUseCase", () => {
  const passengerRepositoryMock = {
    createIfNotExists: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: CreatePassengerUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ passengerRepository: passengerRepositoryMock }),
    );

    useCase = new CreatePassengerUseCase(
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  it("creates or reuses a passenger with normalized details", async () => {
    const passenger = Passenger.create({
      id: "passenger-1",
      userId: "user-1",
      fullName: "reza khaleghi",
      nationalId: "1234567890",
    });

    passengerRepositoryMock.createIfNotExists.mockResolvedValue(passenger);

    const result = await useCase.execute({
      userId: "user-1",
      fullName: "  Reza Khaleghi ",
      nationalId: " 1234567890 ",
    });

    expect(passengerRepositoryMock.createIfNotExists).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        fullName: "reza khaleghi",
        nationalId: "1234567890",
      }),
    );
    expect(result).toEqual({
      id: passenger.id,
      fullName: passenger.fullName,
      nationalId: passenger.nationalId,
      createdAt: passenger.createdAt,
      updatedAt: passenger.updatedAt,
    });
  });

  it.each([
    { fullName: "", nationalId: "123" },
    { fullName: "Reza", nationalId: "" },
    { fullName: "   ", nationalId: "123" },
    { fullName: "Reza", nationalId: "   " },
  ])("rejects invalid passenger details: %j", async (input) => {
    await expect(
      useCase.execute({
        userId: "user-1",
        ...input,
      }),
    ).rejects.toThrow("Invalid passenger information.");

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
  });
});
