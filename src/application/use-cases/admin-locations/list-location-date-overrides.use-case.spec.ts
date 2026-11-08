import { ListLocationDateOverridesUseCase } from "./list-location-date-overrides.use-case";
import { LocationRepository } from "@domain/repositories/location.repository";
import { LocationDateOverrideRepository } from "@domain/repositories/location-date-override.repository";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("ListLocationDateOverridesUseCase", () => {
  const locationRepository = { findById: jest.fn() };
  const overrideRepository = { findByLocation: jest.fn() };
  let useCase: ListLocationDateOverridesUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListLocationDateOverridesUseCase(
      locationRepository as unknown as LocationRepository,
      overrideRepository as unknown as LocationDateOverrideRepository,
    );
  });

  it("returns overrides for an existing location and date range", async () => {
    const overrides = [{ id: "override-1" }];
    locationRepository.findById.mockResolvedValue({ id: "location-1" });
    overrideRepository.findByLocation.mockResolvedValue(overrides);

    await expect(
      useCase.execute({
        locationId: "location-1",
        startDate: "2026-11-10",
        endDate: "2026-11-20",
      }),
    ).resolves.toBe(overrides);

    expect(overrideRepository.findByLocation).toHaveBeenCalledWith(
      "location-1",
      "2026-11-10",
      "2026-11-20",
    );
  });

  it("allows omitted date boundaries", async () => {
    locationRepository.findById.mockResolvedValue({ id: "location-1" });
    overrideRepository.findByLocation.mockResolvedValue([]);

    await useCase.execute({ locationId: "location-1" });

    expect(overrideRepository.findByLocation).toHaveBeenCalledWith(
      "location-1",
      undefined,
      undefined,
    );
  });

  it("rejects a start date after the end date", async () => {
    await expect(
      useCase.execute({
        locationId: "location-1",
        startDate: "2026-11-20",
        endDate: "2026-11-10",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(locationRepository.findById).not.toHaveBeenCalled();
  });

  it("throws when the location does not exist", async () => {
    locationRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({ locationId: "missing" }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(overrideRepository.findByLocation).not.toHaveBeenCalled();
  });
});
