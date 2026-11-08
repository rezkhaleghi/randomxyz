import { AdminListVehiclesUseCase } from "./list-vehicles.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("AdminListVehiclesUseCase", () => {
  const vehicleRepository = { findAdminPage: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: AdminListVehiclesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ vehicleRepository }),
    );
    useCase = new AdminListVehiclesUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("passes admin filters and pagination to the repository", async () => {
    const result = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };
    vehicleRepository.findAdminPage.mockResolvedValue(result);

    await expect(
      useCase.execute({
        userId: "user-1",
        search: "Defender",
        page: 1,
        limit: 20,
        sortBy: "kind",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(result);

    expect(vehicleRepository.findAdminPage).toHaveBeenCalledWith(
      { userId: "user-1", search: "Defender" },
      {
        page: 1,
        limit: 20,
        sortBy: "kind",
        sortDirection: "DESC",
      },
    );
  });
});
