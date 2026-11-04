import { Injectable } from "@nestjs/common";

import {
  LocationFilters,
  LocationRepository,
} from "@domain/repositories/location.repository";
import { PageQuery } from "@shared/pagination/page-query";

export interface ListLocationsInput extends LocationFilters {
  page: number;
  limit: number;
  sortBy?: "name" | "province" | "city" | "createdAt";
  sortDirection?: "ASC" | "DESC";
}

@Injectable()
export class ListLocationsUseCase {
  constructor(private readonly locationRepository: LocationRepository) {}

  execute(input: ListLocationsInput) {
    const pageQuery: PageQuery<"name" | "province" | "city" | "createdAt"> = {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    };

    return this.locationRepository.findPage(
      {
        search: input.search,
        isAvailable: input.isAvailable,
        isEnabled: input.isEnabled,
      },
      pageQuery,
    );
  }
}
