import { UpdatePermitSettingsUseCase } from "./update-permit-setting.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { BadRequestException } from "@nestjs/common";

describe("UpdatePermitSettingsUseCase", () => {
  const permitSettingsRepository = {
    findOrCreateForUpdate: jest.fn(),
    save: jest.fn(),
  };
  const auditLogRepository = { create: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: UpdatePermitSettingsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ permitSettingsRepository, auditLogRepository }),
    );
    useCase = new UpdatePermitSettingsUseCase(
      unitOfWork as unknown as UnitOfWork,
    );
  });

  it.each(["-1", "1.5", "01", "abc", ""])(
    "rejects invalid default fee %s",
    async (defaultFee) => {
      await expect(
        useCase.execute({ actorUserId: "admin-1", defaultFee }),
      ).rejects.toBeInstanceOf(BadRequestException);

      expect(unitOfWork.execute).not.toHaveBeenCalled();
    },
  );

  it("updates the fee and records an audit log when it changes", async () => {
    const settings = { defaultFee: "100", updatedAt: new Date() };
    const updated = { defaultFee: "200", updatedAt: new Date() };

    permitSettingsRepository.findOrCreateForUpdate.mockResolvedValue(settings);
    permitSettingsRepository.save.mockResolvedValue(updated);

    await expect(
      useCase.execute({ actorUserId: "admin-1", defaultFee: "200" }),
    ).resolves.toEqual({
      defaultFee: "200",
      currency: "IRT",
      updatedAt: updated.updatedAt,
    });

    expect(permitSettingsRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ defaultFee: "200" }),
    );
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
  });

  it("does not create an audit log when the fee is unchanged", async () => {
    const settings = { defaultFee: "100", updatedAt: new Date() };
    permitSettingsRepository.findOrCreateForUpdate.mockResolvedValue(settings);
    permitSettingsRepository.save.mockResolvedValue({ ...settings });

    await useCase.execute({
      actorUserId: "admin-1",
      defaultFee: "100",
    });

    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });
});
