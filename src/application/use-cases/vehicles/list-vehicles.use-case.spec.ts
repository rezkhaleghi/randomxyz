import { ListVehiclesUseCase } from "./list-vehicles.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("ListVehiclesUseCase", () => {
  const vehicleRepositoryMock = {
    findUserPage: jest.fn(),
  };

  const unitOfWorkMock = {
    execute: jest.fn(),
  };

  let useCase: ListVehiclesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();

    unitOfWorkMock.execute.mockImplementation((callback: any) =>
      callback({ vehicleRepository: vehicleRepositoryMock }),
    );

    useCase = new ListVehiclesUseCase(unitOfWorkMock as unknown as UnitOfWork);
  });

  it("returns the user's vehicles with pagination and selected fields", async () => {
    const createdAt = new Date();
    const updatedAt = new Date();

    vehicleRepositoryMock.findUserPage.mockResolvedValue({
      data: [
        {
          id: "vehicle-1",
          userId: "user-1",
          kind: "Land Rover Defender",
          color: "Green",
          plateId: "12A345-IR",
          createdAt,
          updatedAt,
        },
      ],
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });

    const result = await useCase.execute({
      userId: "user-1",
      search: "Defender",
      page: 1,
      limit: 20,
      sortBy: "createdAt",
      sortDirection: "DESC",
    });

    expect(vehicleRepositoryMock.findUserPage).toHaveBeenCalledWith(
      "user-1",
      "Defender",
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );

    expect(result.data).toEqual([
      {
        id: "vehicle-1",
        kind: "Land Rover Defender",
        color: "Green",
        plateId: "12A345-IR",
        createdAt,
        updatedAt,
      },
    ]);
    expect(result.total).toBe(1);
  });
});
