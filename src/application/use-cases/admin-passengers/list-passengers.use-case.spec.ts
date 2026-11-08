import { AdminListPassengersUseCase } from "./list-passengers.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("AdminListPassengersUseCase", () => {
  const passengerRepository = { findAdminPage: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: AdminListPassengersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ passengerRepository }),
    );
    useCase = new AdminListPassengersUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it("passes admin filters and pagination to the repository", async () => {
    const result = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };
    passengerRepository.findAdminPage.mockResolvedValue(result);

    await expect(
      useCase.execute({
        userId: "user-1",
        search: "reza",
        page: 1,
        limit: 20,
        sortBy: "fullName",
        sortDirection: "ASC",
      }),
    ).resolves.toBe(result);

    expect(passengerRepository.findAdminPage).toHaveBeenCalledWith(
      { userId: "user-1", search: "reza" },
      {
        page: 1,
        limit: 20,
        sortBy: "fullName",
        sortDirection: "ASC",
      },
    );
  });
});
