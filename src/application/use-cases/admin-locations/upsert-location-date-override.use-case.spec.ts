import { UpsertLocationDateOverrideUseCase } from "./upsert-location-date-override.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { BadRequestException, NotFoundException } from "@nestjs/common";

describe("UpsertLocationDateOverrideUseCase", () => {
  const locationRepository = { findByIdForUpdate: jest.fn() };
  const overrideRepository = {
    findByLocationAndDate: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const auditLogRepository = { create: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: UpsertLocationDateOverrideUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({
        locationRepository,
        locationDateOverrideRepository: overrideRepository,
        auditLogRepository,
      }),
    );
    useCase = new UpsertLocationDateOverrideUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it("requires at least one override setting", async () => {
    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        locationId: "location-1",
        date: "2026-11-10",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it.each(["2026-02-30", "10-11-2026", "invalid"])(
    "rejects invalid date %s",
    async (date) => {
      await expect(
        useCase.execute({
          actorUserId: "admin-1",
          locationId: "location-1",
          date,
          capacity: 10,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(unitOfWork.execute).not.toHaveBeenCalled();
    },
  );

  it("creates an override when one does not exist", async () => {
    const created = {
      id: "override-1",
      date: "2026-11-10",
      capacity: 10,
      fee: null,
    };
    locationRepository.findByIdForUpdate.mockResolvedValue({
      id: "location-1",
    });
    overrideRepository.findByLocationAndDate.mockResolvedValue(null);
    overrideRepository.create.mockResolvedValue(created);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        locationId: "location-1",
        date: "2026-11-10",
        capacity: 10,
      }),
    ).resolves.toBe(created);

    expect(overrideRepository.create).toHaveBeenCalledWith({
      locationId: "location-1",
      date: "2026-11-10",
      capacity: 10,
      fee: null,
    });
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
  });

  it("updates an existing override and audits changed values", async () => {
    const existing = {
      id: "override-1",
      date: "2026-11-10",
      capacity: 10,
      fee: "100",
    };
    const updated = { ...existing, capacity: 20 };

    locationRepository.findByIdForUpdate.mockResolvedValue({
      id: "location-1",
    });
    overrideRepository.findByLocationAndDate.mockResolvedValue(existing);
    overrideRepository.save.mockResolvedValue(updated);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        locationId: "location-1",
        date: "2026-11-10",
        capacity: 20,
      }),
    ).resolves.toBe(updated);

    expect(overrideRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ capacity: 20 }),
    );
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
  });

  it("does not audit an unchanged override", async () => {
    const existing = {
      id: "override-1",
      date: "2026-11-10",
      capacity: 10,
      fee: "100",
    };
    locationRepository.findByIdForUpdate.mockResolvedValue({
      id: "location-1",
    });
    overrideRepository.findByLocationAndDate.mockResolvedValue(existing);
    overrideRepository.save.mockResolvedValue({ ...existing });

    await useCase.execute({
      actorUserId: "admin-1",
      locationId: "location-1",
      date: "2026-11-10",
      capacity: 10,
    });

    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("throws when the location does not exist", async () => {
    locationRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        locationId: "missing",
        date: "2026-11-10",
        capacity: 10,
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(overrideRepository.create).not.toHaveBeenCalled();
  });
});
