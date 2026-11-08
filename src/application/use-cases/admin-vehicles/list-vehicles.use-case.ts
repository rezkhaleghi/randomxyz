import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { VehicleSortBy } from "@domain/repositories/vehicle.repository";

export interface AdminListVehiclesInput {
  userId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy?: VehicleSortBy;
  sortDirection?: "ASC" | "DESC";
}

@Injectable()
export class AdminListVehiclesUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: AdminListVehiclesInput) {
    return this.unitOfWork.execute(async ({ vehicleRepository }) => {
      return vehicleRepository.findAdminPage(
        {
          userId: input.userId,
          search: input.search,
        },
        {
          page: input.page,
          limit: input.limit,
          sortBy: input.sortBy,
          sortDirection: input.sortDirection,
        },
      );
    });
  }
}
