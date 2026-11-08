import { SyncLocationsUseCase } from "./sync-locations.use-case";
import { TmarTravelLocationsClient } from "@application/interfaces/tmar-locations-client.interface";
import { LocationRepository } from "@domain/repositories/location.repository";

describe("SyncLocationsUseCase", () => {
  const client = { fetchAvailableLocations: jest.fn() };
  const locationRepository = { syncAvailableLocations: jest.fn() };
  let useCase: SyncLocationsUseCase;

  const response = {
    status: 200,
    result: {
      pagination: { total: 1 },
      items: [
        {
          _id: " external-1 ",
          name: " Location ",
          slug: " location ",
          province: " Mazandaran ",
          city: " Sari ",
          x: " 1 ",
          y: " 2 ",
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    client.fetchAvailableLocations.mockResolvedValue(response);
    useCase = new SyncLocationsUseCase(
      client as unknown as TmarTravelLocationsClient,
      locationRepository as unknown as LocationRepository,
    );
  });

  it("validates, normalizes and synchronizes locations", async () => {
    await expect(useCase.execute()).resolves.toBe(1);

    expect(locationRepository.syncAvailableLocations).toHaveBeenCalledWith([
      {
        externalId: "external-1",
        name: "Location",
        slug: "location",
        province: "Mazandaran",
        city: "Sari",
        x: "1",
        y: "2",
      },
    ]);
  });

  it("rejects an invalid response", async () => {
    client.fetchAvailableLocations.mockResolvedValue({ status: 500 });

    await expect(useCase.execute()).rejects.toThrow(
      "Invalid Tmar-Travel locations response.",
    );
    expect(locationRepository.syncAvailableLocations).not.toHaveBeenCalled();
  });

  it("rejects incomplete pagination results", async () => {
    client.fetchAvailableLocations.mockResolvedValue({
      ...response,
      result: { ...response.result, pagination: { total: 2 } },
    });

    await expect(useCase.execute()).rejects.toThrow(
      "Incomplete Tmar-Travel locations response",
    );
  });

  it("rejects duplicate external IDs", async () => {
    client.fetchAvailableLocations.mockResolvedValue({
      status: 200,
      result: {
        pagination: { total: 2 },
        items: [response.result.items[0], response.result.items[0]],
      },
    });

    await expect(useCase.execute()).rejects.toThrow(
      "Invalid or duplicate Tmar-Travel location ID.",
    );
  });

  it("rejects invalid coordinates", async () => {
    client.fetchAvailableLocations.mockResolvedValue({
      status: 200,
      result: {
        pagination: { total: 1 },
        items: [{ ...response.result.items[0], x: "not-a-coordinate" }],
      },
    });

    await expect(useCase.execute()).rejects.toThrow(
      "Invalid data received for Tmar-Travel location external-1.",
    );
  });

  it("does not synchronize when the external client fails", async () => {
    client.fetchAvailableLocations.mockRejectedValue(
      new Error("Tmar-Travel unavailable"),
    );

    await expect(useCase.execute()).rejects.toThrow("Tmar-Travel unavailable");
    expect(locationRepository.syncAvailableLocations).not.toHaveBeenCalled();
  });
});
