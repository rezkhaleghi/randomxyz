import { DeleteLocationDateOverrideUseCase } from "./delete-location-date-override.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { NotFoundException } from "@nestjs/common";

describe("DeleteLocationDateOverrideUseCase", () => {
  const overrideRepository = {
    findByIdForUpdate: jest.fn(),
    deleteById: jest.fn(),
  };
  const auditLogRepository = { create: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: DeleteLocationDateOverrideUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({
        locationDateOverrideRepository: overrideRepository,
        auditLogRepository,
      }),
    );
    useCase = new DeleteLocationDateOverrideUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it("deletes the override and records an audit log", async () => {
    const override = {
      id: "override-1",
      date: "2026-11-10",
      capacity: 10,
      fee: "100",
    };
    overrideRepository.findByIdForUpdate.mockResolvedValue(override);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        locationId: "location-1",
        overrideId: "override-1",
      }),
    ).resolves.toBeUndefined();

    expect(overrideRepository.findByIdForUpdate).toHaveBeenCalledWith(
      "location-1",
      "override-1",
    );
    expect(overrideRepository.deleteById).toHaveBeenCalledWith("override-1");
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
  });

  it("throws when the override does not exist", async () => {
    overrideRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        actorUserId: "admin-1",
        locationId: "location-1",
        overrideId: "missing",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(overrideRepository.deleteById).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
