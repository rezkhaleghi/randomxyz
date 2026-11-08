import { UpdateLocationUseCase } from "./update-location.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("UpdateLocationUseCase", () => {
  const locationRepository = {
    findByIdForUpdate: jest.fn(),
    save: jest.fn(),
  };
  const auditLogRepository = { create: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: UpdateLocationUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ locationRepository, auditLogRepository }),
    );
    useCase = new UpdateLocationUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("rejects an update with no settings", async () => {
    await expect(
      useCase.execute({ actorUserId: "admin-1", id: "location-1" }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it("updates the location and records changed settings", async () => {
    const location = {
      id: "location-1",
      externalId: "external-1",
      isEnabled: true,
      capacity: 10,
      fee: "100",
    };
    const updated = { ...location, capacity: 20 };

    locationRepository.findByIdForUpdate.mockResolvedValue(location);
    locationRepository.save.mockResolvedValue(updated);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        id: "location-1",
        capacity: 20,
      }),
    ).resolves.toBe(updated);

    expect(locationRepository.save).toHaveBeenCalledWith({
      ...location,
      capacity: 20,
    });
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
  });

  it("does not create an audit log when no values changed", async () => {
    const location = {
      id: "location-1",
      externalId: "external-1",
      isEnabled: true,
      capacity: 10,
      fee: "100",
    };

    locationRepository.findByIdForUpdate.mockResolvedValue(location);
    locationRepository.save.mockResolvedValue({ ...location });

    await useCase.execute({
      actorUserId: "admin-1",
      id: "location-1",
      capacity: 10,
    });

    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("allows explicitly clearing the location fee", async () => {
    const location = {
      id: "location-1",
      externalId: "external-1",
      isEnabled: true,
      capacity: 10,
      fee: "100",
    };
    locationRepository.findByIdForUpdate.mockResolvedValue(location);
    locationRepository.save.mockImplementation(async (value) => value);

    const result = await useCase.execute({
      actorUserId: "admin-1",
      id: "location-1",
      fee: null,
    });

    expect(result.fee).toBeNull();
  });

  it("throws when the location does not exist", async () => {
    locationRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        id: "missing",
        capacity: 10,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(locationRepository.save).not.toHaveBeenCalled();
  });
});
