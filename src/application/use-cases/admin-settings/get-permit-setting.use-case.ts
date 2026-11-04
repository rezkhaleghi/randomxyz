import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class GetPermitSettingsUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute() {
    return this.unitOfWork.execute(async ({ permitSettingsRepository }) => {
      const settings = await permitSettingsRepository.findOrCreate();

      return {
        defaultFee: settings.defaultFee,
        currency: "IRT",
        updatedAt: settings.updatedAt,
      };
    });
  }
}
