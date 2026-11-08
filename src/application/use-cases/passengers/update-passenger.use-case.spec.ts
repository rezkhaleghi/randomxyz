import { UpdatePassengerUseCase } from "./update-passenger.use-case";
import { Passenger } from "@domain/entities/passenger.entity";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";

describe("UpdatePassengerUseCase", () => {
  const passengerRepositoryMock = {
    findByIdForUser: jest.fn(),
    findByUnique: jest.fn(),
    save: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: UpdatePassengerUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ passengerRepository: passengerRepositoryMock }),
    );

    useCase = new UpdatePassengerUseCase(
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  const createPassenger = () =>
    Passenger.create({
      id: "passenger-1",
      userId: "user-1",
      fullName: "old name",
      nationalId: "111",
    });

  it("updates passenger details after normalizing them", async () => {
    const passenger = createPassenger();

    passengerRepositoryMock.findByIdForUser.mockResolvedValue(passenger);
    passengerRepositoryMock.findByUnique.mockResolvedValue(null);
    passengerRepositoryMock.save.mockImplementation(async (value) => value);

    const result = await useCase.execute({
      id: "passenger-1",
      userId: "user-1",
      fullName: " Reza Khaleghi ",
      nationalId: " 1234567890 ",
    });

    expect(passengerRepositoryMock.findByUnique).toHaveBeenCalledWith(
      "user-1",
      "reza khaleghi",
      "1234567890",
    );
    expect(result.fullName).toBe("reza khaleghi");
    expect(result.nationalId).toBe("1234567890");
    expect(passengerRepositoryMock.save).toHaveBeenCalledWith(passenger);
  });

  it("does not reject the passenger's unchanged unique details", async () => {
    const passenger = createPassenger();

    passengerRepositoryMock.findByIdForUser.mockResolvedValue(passenger);
    passengerRepositoryMock.findByUnique.mockResolvedValue(passenger);
    passengerRepositoryMock.save.mockImplementation(async (value) => value);

    await expect(
      useCase.execute({
        id: passenger.id,
        userId: "user-1",
        fullName: "Old Name",
        nationalId: "111",
      }),
    ).resolves.toMatchObject({
      id: passenger.id,
      fullName: "old name",
      nationalId: "111",
    });
  });

  it("throws when the passenger does not belong to the user", async () => {
    passengerRepositoryMock.findByIdForUser.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: "passenger-1",
        userId: "user-1",
        fullName: "Reza",
        nationalId: "123",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(passengerRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("rejects duplicate passenger details", async () => {
    const passenger = createPassenger();

    passengerRepositoryMock.findByIdForUser.mockResolvedValue(passenger);
    passengerRepositoryMock.findByUnique.mockResolvedValue({
      id: "another-passenger",
    });

    await expect(
      useCase.execute({
        id: passenger.id,
        userId: "user-1",
        fullName: "Another Name",
        nationalId: "222",
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(passengerRepositoryMock.save).not.toHaveBeenCalled();
  });

  it("rejects empty passenger details", async () => {
    await expect(
      useCase.execute({
        id: "passenger-1",
        userId: "user-1",
        fullName: " ",
        nationalId: "123",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(unitOfWorkMock.execute).not.toHaveBeenCalled();
  });
});
