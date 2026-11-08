import { AdminListPermitsUseCase } from "./list-permits.use-case";
import { PermitRepository } from "@domain/repositories/permit.repository";

describe("AdminListPermitsUseCase", () => {
  const permitRepository = { findAdminPage: jest.fn() };
  let useCase: AdminListPermitsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AdminListPermitsUseCase(
      permitRepository as unknown as PermitRepository,
    );
  });

  it("passes filters and pagination to the repository", async () => {
    const result = { data: [], page: 1, limit: 20, total: 0, totalPages: 0 };
    permitRepository.findAdminPage.mockResolvedValue(result);

    await expect(
      useCase.execute({
        userId: "user-1",
        locationId: "location-1",
        status: undefined,
        startDateFrom: "2026-11-01",
        startDateTo: "2026-11-30",
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(result);

    expect(permitRepository.findAdminPage).toHaveBeenCalledWith(
      {
        userId: "user-1",
        locationId: "location-1",
        status: undefined,
        startDateFrom: "2026-11-01",
        startDateTo: "2026-11-30",
      },
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });
});
