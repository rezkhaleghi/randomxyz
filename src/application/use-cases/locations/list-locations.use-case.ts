import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PageQuery } from "@shared/pagination/page-query";

export interface ListLocationsInput {
  page: number;
  limit: number;
  search?: string;
}

@Injectable()
export class ListLocationsUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: ListLocationsInput) {
    return this.unitOfWork.execute(
      async ({ locationRepository, permitSettingsRepository }) => {
        const params: PageQuery<"name"> = {
          page: input.page,
          limit: input.limit,
          sortBy: "name",
          sortDirection: "ASC",
        };

        const result = await locationRepository.findAvailablePage(
          input.search,
          params,
        );

        const settings = await permitSettingsRepository.findOrCreate();

        return {
          ...result,
          data: result.data.map((location) => ({
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
          })),
        };
      },
    );
  }
}
