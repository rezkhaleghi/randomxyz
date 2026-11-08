import { GetPermitSettingsUseCase } from "./get-permit-setting.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

describe("GetPermitSettingsUseCase", () => {
  const permitSettingsRepository = { findOrCreate: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: GetPermitSettingsUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ permitSettingsRepository }),
    );
    useCase = new GetPermitSettingsUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("returns the current permit settings", async () => {
    const updatedAt = new Date();
    permitSettingsRepository.findOrCreate.mockResolvedValue({
      defaultFee: "500",
      updatedAt,
    });

    await expect(useCase.execute()).resolves.toEqual({
      defaultFee: "500",
      currency: "IRT",
      updatedAt,
    });
  });
});
