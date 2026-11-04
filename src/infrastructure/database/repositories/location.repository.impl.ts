import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";

import {
  LocationRepository,
  LocationSyncRecord,
} from "@domain/repositories/location.repository";

import { LocationOrmEntity } from "../orm-entities/location.orm-entity";

@Injectable()
export class LocationRepositoryImpl extends LocationRepository {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async syncAvailableLocations(locations: LocationSyncRecord[]): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(LocationOrmEntity);

      if (locations.length > 0) {
        const rows = locations.map((location) => ({
          externalId: location.externalId,
          name: location.name,
          slug: location.slug,
          province: location.province,
          city: location.city,
          x: location.x,
          y: location.y,
          isAvailable: true,
        }));

        // Only the supplied canonical fields are updated.
        // Local settings such as isEnabled are intentionally untouched.
        await repository.upsert(rows, {
          conflictPaths: ["externalId"],
          skipUpdateIfNoValuesChanged: true,
        });
      }

      const updateQuery = repository
        .createQueryBuilder()
        .update(LocationOrmEntity)
        .set({ isAvailable: false })
        .where('"isAvailable" = :isAvailable', { isAvailable: true });

      if (locations.length > 0) {
        updateQuery.andWhere('"externalId" NOT IN (:...externalIds)', {
          externalIds: locations.map((location) => location.externalId),
        });
      }

      await updateQuery.execute();
    });
  }
}
