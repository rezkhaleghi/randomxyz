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
  capacity: number;
  fee: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocationFilters {
  search?: string;
  isAvailable?: boolean;
  isEnabled?: boolean;
}

export type LocationSortBy = "name" | "province" | "city" | "createdAt";

export abstract class LocationRepository {
  abstract syncAvailableLocations(
    locations: LocationSyncRecord[],
  ): Promise<void>;

  abstract findPage(
    filters: LocationFilters,
    params: PageQuery<LocationSortBy>,
  ): Promise<PageResult<LocationRecord>>;

  abstract findAvailablePage(
    search: string | undefined,
    params: PageQuery<"name">,
  ): Promise<PageResult<LocationRecord>>;

  abstract findAvailableById(id: string): Promise<LocationRecord | null>;

  abstract findById(id: string): Promise<LocationRecord | null>;

  abstract findByIdForUpdate(id: string): Promise<LocationRecord | null>;

  abstract save(location: LocationRecord): Promise<LocationRecord>;
}
