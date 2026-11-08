import { AdminListLocationsUseCase } from "./list-locations.use-case";
import { LocationRepository } from "@domain/repositories/location.repository";

describe("AdminListLocationsUseCase", () => {
  const locationRepository = { findPage: jest.fn() };
  let useCase: AdminListLocationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AdminListLocationsUseCase(
      locationRepository as unknown as LocationRepository,
    );
  });

  it("passes filters and pagination to the repository", async () => {
    const result = {
      data: [],
      page: 2,
      limit: 10,
      total: 0,
      totalPages: 0,
    };
    locationRepository.findPage.mockResolvedValue(result);

    await expect(
      useCase.execute({
        page: 2,
        limit: 10,
        search: "Mazandaran",
        isAvailable: true,
        isEnabled: false,
        sortBy: "city",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(result);

    expect(locationRepository.findPage).toHaveBeenCalledWith(
      {
        search: "Mazandaran",
        isAvailable: true,
        isEnabled: false,
      },
      {
        page: 2,
        limit: 10,
        sortBy: "city",
        sortDirection: "DESC",
      },
    );
  });
});
