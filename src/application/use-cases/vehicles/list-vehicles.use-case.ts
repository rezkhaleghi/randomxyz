import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { VehicleSortBy } from "@domain/repositories/vehicle.repository";
import { PageQuery } from "@shared/pagination/page-query";

export interface ListVehiclesInput extends PageQuery<VehicleSortBy> {
  userId: string;
  search?: string;
}

@Injectable()
export class ListVehiclesUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: ListVehiclesInput) {
    return this.unitOfWork.execute(async ({ vehicleRepository }) => {
      const result = await vehicleRepository.findUserPage(
        input.userId,
        input.search,
        {
          page: input.page,
          limit: input.limit,
          sortBy: input.sortBy,
          sortDirection: input.sortDirection,
        },
      );

      return {
        ...result,
        data: result.data.map((vehicle) => ({
          id: vehicle.id,
          kind: vehicle.kind,
          color: vehicle.color,
          plateId: vehicle.plateId,
          createdAt: vehicle.createdAt,
          updatedAt: vehicle.updatedAt,
        })),
      };
    });
  }
}
