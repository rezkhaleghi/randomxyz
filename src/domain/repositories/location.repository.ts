import { PageQuery, PageResult } from "@shared/pagination/page-query";

export interface LocationSyncRecord {
  externalId: string;
  name: string;
  slug: string;
  province: string;
  city: string;
  x: string;
  y: string;
}

export interface LocationRecord {
  id: string;
  externalId: string;
  name: string;
  slug: string;
  province: string;
  city: string;
  x: string;
  y: string;
  isAvailable: boolean;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationFilters {
  search?: string;
  isAvailable?: boolean;
  isEnabled?: boolean;
}

export abstract class LocationRepository {
  abstract syncAvailableLocations(
    locations: LocationSyncRecord[],
  ): Promise<void>;

  abstract findPage(
    filters: LocationFilters,
    params: PageQuery<"name" | "province" | "city" | "createdAt">,
  ): Promise<PageResult<LocationRecord>>;
}
