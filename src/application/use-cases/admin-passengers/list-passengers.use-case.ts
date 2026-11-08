import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PassengerSortBy } from "@domain/repositories/passenger.repository";

export interface AdminListPassengersInput {
  userId?: string;
  search?: string;
  page: number;
  limit: number;
  sortBy?: PassengerSortBy;
  sortDirection?: "ASC" | "DESC";
}

@Injectable()
export class AdminListPassengersUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: AdminListPassengersInput) {
    return this.unitOfWork.execute(async ({ passengerRepository }) => {
      return passengerRepository.findAdminPage(
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
