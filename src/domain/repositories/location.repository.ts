export interface LocationSyncRecord {
  externalId: string;
  name: string;
  slug: string;
  province: string;
  city: string;
  x: string;
  y: string;
}

export abstract class LocationRepository {
  abstract syncAvailableLocations(
    locations: LocationSyncRecord[],
  ): Promise<void>;
}
