import { Injectable, Logger } from "@nestjs/common";

import { LocationsClient } from "@application/interfaces/locations-client.interface";
import {
  LocationRepository,
  LocationSyncRecord,
} from "@domain/repositories/location.repository";

interface TmarTravelLocationResponse {
  status: number;
  result: {
    pagination: {
      total: number;
    };
    items: Array<{
      _id: string;
      name: string;
      slug: string;
      province: string;
      city: string;
      x: string;
      y: string;
    }>;
  };
}

@Injectable()
export class SyncLocationsUseCase {
  private readonly logger = new Logger(SyncLocationsUseCase.name);

  constructor(
    private readonly client: LocationsClient,
    private readonly locationRepository: LocationRepository,
  ) {}

  async execute(): Promise<number> {
    const response = await this.client.fetchAvailableLocations();

    if (!this.isResponse(response)) {
      throw new Error("Invalid Tmar-Travel locations response.");
    }

    const { total } = response.result.pagination;
    const items = response.result.items;

    if (total !== items.length) {
      throw new Error(
        `Incomplete Tmar-Travel locations response: expected ${total}, received ${items.length}.`,
      );
    }

    const seenIds = new Set<string>();

    const locations: LocationSyncRecord[] = items.map((item) => {
      const externalId = item._id.trim();

      if (!externalId || seenIds.has(externalId)) {
        throw new Error("Invalid or duplicate Tmar-Travel location ID.");
      }

      seenIds.add(externalId);

      const name = item.name.trim();
      const slug = item.slug.trim();
      const province = item.province.trim();
      const city = item.city.trim();
      const x = item.x.trim();
      const y = item.y.trim();

      if (
        !name ||
        !slug ||
        !province ||
        !city ||
        !x ||
        !y ||
        !Number.isFinite(Number(x)) ||
        !Number.isFinite(Number(y))
      ) {
        throw new Error(
          `Invalid data received for Tmar-Travel location ${externalId}.`,
        );
      }

      return {
        externalId,
        name,
        slug,
        province,
        city,
        x,
        y,
      };
    });

    await this.locationRepository.syncAvailableLocations(locations);

    this.logger.log(`Synchronized ${locations.length} locations.`);

    return locations.length;
  }

  private isResponse(value: unknown): value is TmarTravelLocationResponse {
    if (!value || typeof value !== "object") {
      return false;
    }

    const response = value as Record<string, unknown>;

    if (response.status !== 200 || !response.result) {
      return false;
    }

    const result = response.result as Record<string, unknown>;

    if (!result.pagination || !Array.isArray(result.items)) {
      return false;
    }

    const pagination = result.pagination as Record<string, unknown>;

    if (
      !Number.isInteger(pagination.total) ||
      (pagination.total as number) < 0
    ) {
      return false;
    }

    return result.items.every((item: unknown) => {
      if (!item || typeof item !== "object") {
        return false;
      }

      const location = item as Record<string, unknown>;

      return (
        typeof location._id === "string" &&
        typeof location.name === "string" &&
        typeof location.slug === "string" &&
        typeof location.province === "string" &&
        typeof location.city === "string" &&
        typeof location.x === "string" &&
        typeof location.y === "string"
      );
    });
  }
}
