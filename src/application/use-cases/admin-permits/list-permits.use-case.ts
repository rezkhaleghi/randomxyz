import { Injectable } from "@nestjs/common";

import {
  AdminPermitFilters,
  AdminPermitSortBy,
  PermitRepository,
} from "@domain/repositories/permit.repository";
import { PageQuery } from "@shared/pagination/page-query";

export interface AdminListPermitsInput extends AdminPermitFilters {
  page: number;
  limit: number;
  sortBy?: AdminPermitSortBy;
  sortDirection?: "ASC" | "DESC";
}

@Injectable()
export class AdminListPermitsUseCase {
  constructor(private readonly permitRepository: PermitRepository) {}

  execute(input: AdminListPermitsInput) {
    return this.permitRepository.findAdminPage(
      {
        userId: input.userId,
        locationId: input.locationId,
        status: input.status,
        startDateFrom: input.startDateFrom,
        startDateTo: input.startDateTo,
      },
      {
        page: input.page,
        limit: input.limit,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
      } as PageQuery<AdminPermitSortBy>,
    );
  }
}
