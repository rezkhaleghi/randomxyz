import { GetLocationUseCase } from "./get-location.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { NotFoundException } from "@nestjs/common";

describe("GetLocationUseCase", () => {
  const locationRepository = { findAvailableById: jest.fn() };
  const permitSettingsRepository = { findOrCreate: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: GetLocationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ locationRepository, permitSettingsRepository }),
    );
    permitSettingsRepository.findOrCreate.mockResolvedValue({
      defaultFee: "500",
    });
    useCase = new GetLocationUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("returns location details using its configured fee", async () => {
    locationRepository.findAvailableById.mockResolvedValue({
      id: "location-1",
      name: "Location",
      slug: "location",
      province: "Mazandaran",
      city: "Sari",
      x: "1",
      y: "2",
      fee: "200",
      capacity: 10,
    });

    await expect(useCase.execute("location-1")).resolves.toMatchObject({
      id: "location-1",
      fee: "200",
      currency: "IRT",
      capacity: 10,
    });
    expect(permitSettingsRepository.findOrCreate).toHaveBeenCalled();
  });

  it("uses the default fee when the location has no fee", async () => {
    locationRepository.findAvailableById.mockResolvedValue({
      id: "location-1",
      name: "Location",
      slug: "location",
      province: "Mazandaran",
      city: "Sari",
      x: "1",
      y: "2",
      fee: null,
      capacity: 10,
    });

    await expect(useCase.execute("location-1")).resolves.toMatchObject({
      fee: "500",
    });
  });

  it("throws when the location is not publicly available", async () => {
    locationRepository.findAvailableById.mockResolvedValue(null);

    await expect(useCase.execute("location-1")).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(permitSettingsRepository.findOrCreate).not.toHaveBeenCalled();
  });
});
