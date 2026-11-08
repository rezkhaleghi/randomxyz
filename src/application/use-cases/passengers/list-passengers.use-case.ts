import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PassengerSortBy } from "@domain/repositories/passenger.repository";
import { PageQuery } from "@shared/pagination/page-query";

export interface ListPassengersInput extends PageQuery<PassengerSortBy> {
  userId: string;
  search?: string;
}

@Injectable()
export class ListPassengersUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: ListPassengersInput) {
    return this.unitOfWork.execute(async ({ passengerRepository }) => {
      const result = await passengerRepository.findUserPage(
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
        data: result.data.map((passenger) => ({
          id: passenger.id,
          fullName: passenger.fullName,
          nationalId: passenger.nationalId,
          createdAt: passenger.createdAt,
          updatedAt: passenger.updatedAt,
        })),
      };
    });
  }
}
