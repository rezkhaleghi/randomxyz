import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PermitStatus } from "@domain/enums/permit-status.enum";
import { PermitSortBy } from "@domain/repositories/permit.repository";
import { PageQuery } from "@shared/pagination/page-query";

export interface ListPermitsInput extends PageQuery<PermitSortBy> {
  userId: string;
  statuses?: PermitStatus[];
}

@Injectable()
export class ListPermitsUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: ListPermitsInput) {
    return this.unitOfWork.execute(async ({ permitRepository }) => {
      const result = await permitRepository.findUserPage(
        input.userId,
        input.statuses,
        {
          page: input.page,
          limit: input.limit,
          sortBy: input.sortBy,
          sortDirection: input.sortDirection,
        },
      );

      return {
        ...result,
        data: result.data.map((permit) => ({
          id: permit.id,
          locationId: permit.locationId,
          startDate: permit.startDate,
          endDate: permit.endDate,
          status: permit.status,
          totalAmount: permit.totalAmount,
          currency: permit.currency,
          createdAt: permit.createdAt,
        })),
      };
    });
  }
}
