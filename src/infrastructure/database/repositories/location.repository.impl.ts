import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";

import {
  LocationFilters,
  LocationRecord,
  LocationRepository,
  LocationSortBy,
  LocationSyncRecord,
} from "@domain/repositories/location.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { LocationOrmEntity } from "../orm-entities/location.orm-entity";

@Injectable()
export class LocationRepositoryImpl extends LocationRepository {
  constructor(
    @InjectRepository(LocationOrmEntity)
    private readonly repository: Repository<LocationOrmEntity>,
    private readonly dataSource: DataSource,
  ) {
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

        await repository.upsert(rows, {
          conflictPaths: ["externalId"],
          skipUpdateIfNoValuesChanged: true,
        });
      }

      const updateQuery = repository
        .createQueryBuilder()
        .update(LocationOrmEntity)
        .set({ isAvailable: false })
        .where('"isAvailable" = :isAvailable', {
          isAvailable: true,
        });

      if (locations.length > 0) {
        updateQuery.andWhere('"externalId" NOT IN (:...externalIds)', {
          externalIds: locations.map((location) => location.externalId),
        });
      }

      await updateQuery.execute();
    });
  }

  async findPage(
    filters: LocationFilters,
    params: PageQuery<LocationSortBy>,
  ): Promise<PageResult<LocationRecord>> {
    const query = this.repository.createQueryBuilder("location");

    if (filters.search?.trim()) {
      query.andWhere(
        `(
          LOWER(location.name) LIKE LOWER(:search)
          OR LOWER(location.city) LIKE LOWER(:search)
          OR LOWER(location.province) LIKE LOWER(:search)
          OR LOWER(location.slug) LIKE LOWER(:search)
        )`,
        { search: `%${filters.search.trim()}%` },
      );
    }

    if (filters.isAvailable !== undefined) {
      query.andWhere("location.isAvailable = :isAvailable", {
        isAvailable: filters.isAvailable,
      });
    }

    if (filters.isEnabled !== undefined) {
      query.andWhere("location.isEnabled = :isEnabled", {
        isEnabled: filters.isEnabled,
      });
    }

    const sortColumns: Record<LocationSortBy, string> = {
      name: "location.name",
      province: "location.province",
      city: "location.city",
      createdAt: "location.createdAt",
    };

    query
      .orderBy(
        sortColumns[params.sortBy ?? "name"],
        params.sortDirection ?? "ASC",
      )
      .addOrderBy("location.id", "ASC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit);

    const [rows, total] = await query.getManyAndCount();

    return {
      data: rows,
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findById(id: string): Promise<LocationRecord | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdForUpdate(id: string): Promise<LocationRecord | null> {
    return this.repository
      .createQueryBuilder("location")
      .setLock("pessimistic_write")
      .where("location.id = :id", { id })
      .getOne();
  }

  async save(location: LocationRecord): Promise<LocationRecord> {
    return this.repository.save(location as LocationOrmEntity);
  }
}
