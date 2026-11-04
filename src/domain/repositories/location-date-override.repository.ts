export interface LocationDateOverrideRecord {
  id: string;
  locationId: string;
  date: string;
  capacity: number | null;
  fee: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class LocationDateOverrideRepository {
  abstract findByLocation(
    locationId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<LocationDateOverrideRecord[]>;

  abstract findByIdForUpdate(
    locationId: string,
    id: string,
  ): Promise<LocationDateOverrideRecord | null>;

  abstract create(override: {
    locationId: string;
    date: string;
    capacity: number | null;
    fee: string | null;
  }): Promise<LocationDateOverrideRecord>;

  abstract save(
    override: LocationDateOverrideRecord,
  ): Promise<LocationDateOverrideRecord>;

  abstract deleteById(id: string): Promise<void>;
}
