import { ListPassengersUseCase } from "./list-passengers.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("ListPassengersUseCase", () => {
  const passengerRepositoryMock = {
    findUserPage: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: ListPassengersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ passengerRepository: passengerRepositoryMock }),
    );

    useCase = new ListPassengersUseCase(
      unitOfWorkMock as unknown as UnitOfWork,
    );
  });

  it("returns the user's passengers with pagination and selected fields", async () => {
    const createdAt = new Date();
    const updatedAt = new Date();

    passengerRepositoryMock.findUserPage.mockResolvedValue({
      data: [
        {
          id: "passenger-1",
          fullName: "reza khaleghi",
          nationalId: "1234567890",
          createdAt,
          updatedAt,
          userId: "user-1",
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    const result = await useCase.execute({
      userId: "user-1",
      search: "reza",
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });

    expect(passengerRepositoryMock.findUserPage).toHaveBeenCalledWith(
      "user-1",
      "reza",
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );

    expect(result.data).toEqual([
      {
        id: "passenger-1",
        fullName: "reza khaleghi",
        nationalId: "1234567890",
        createdAt,
        updatedAt,
      },
    ]);
    expect(result.total).toBe(1);
  });
});
