import { ListLocationsUseCase } from "./list-locations.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("ListLocationsUseCase", () => {
  const locationRepository = { findAvailablePage: jest.fn() };
  const permitSettingsRepository = { findOrCreate: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: ListLocationsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ locationRepository, permitSettingsRepository }),
    );
    permitSettingsRepository.findOrCreate.mockResolvedValue({
      defaultFee: "500",
    });
    useCase = new ListLocationsUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("returns paginated locations with their configured fees", async () => {
    locationRepository.findAvailablePage.mockResolvedValue({
      data: [
        {
          id: "location-1",
          name: "Location 1",
          slug: "location-1",
          province: "Mazandaran",
          city: "Sari",
          x: "1",
          y: "2",
          fee: "200",
          capacity: 10,
        },
        {
          id: "location-2",
          name: "Location 2",
          slug: "location-2",
          province: "Mazandaran",
          city: "Babol",
          x: "3",
          y: "4",
          fee: null,
          capacity: 20,
        },
      ],
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });

    const result = await useCase.execute({
      page: 1,
      limit: 20,
      search: "Mazandaran",
    });

    expect(locationRepository.findAvailablePage).toHaveBeenCalledWith(
      "Mazandaran",
      {
        page: 1,
        limit: 20,
        sortBy: "name",
        sortDirection: "ASC",
      },
    );
    expect(result.data[0].fee).toBe("200");
    expect(result.data[1].fee).toBe("500");
    expect(result.total).toBe(2);
    expect(result.data[0].currency).toBe("IRT");
  });
});
