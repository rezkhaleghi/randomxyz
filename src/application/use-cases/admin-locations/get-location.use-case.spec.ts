import { AdminGetLocationUseCase } from "./get-location.use-case";
import { LocationRepository } from "@domain/repositories/location.repository";
import { NotFoundException } from "@nestjs/common";

describe("AdminGetLocationUseCase", () => {
  const locationRepository = { findById: jest.fn() };
  let useCase: AdminGetLocationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AdminGetLocationUseCase(
      locationRepository as unknown as LocationRepository,
    );
  });

  it("returns the requested location", async () => {
    const location = { id: "location-1", name: "Location" };
    locationRepository.findById.mockResolvedValue(location);

    await expect(useCase.execute("location-1")).resolves.toBe(location);
    expect(locationRepository.findById).toHaveBeenCalledWith("location-1");
  });

  it("throws when the location does not exist", async () => {
    locationRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
