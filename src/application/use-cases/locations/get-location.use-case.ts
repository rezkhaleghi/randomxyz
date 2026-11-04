import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class GetLocationUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(id: string) {
    return this.unitOfWork.execute(
      async ({ locationRepository, permitSettingsRepository }) => {
        const location = await locationRepository.findAvailableById(id);

        if (!location) {
          throw new NotFoundException("Location not found.");
        }

        const settings = await permitSettingsRepository.findOrCreate();

        return {
          id: location.id,
          name: location.name,
          slug: location.slug,
          province: location.province,
          city: location.city,
          x: location.x,
          y: location.y,
          fee: location.fee ?? settings.defaultFee,
          capacity: location.capacity,
          currency: "IRT",
        };
      },
    );
  }
}
