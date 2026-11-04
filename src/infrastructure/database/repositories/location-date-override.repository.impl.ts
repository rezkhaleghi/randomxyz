import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { ConflictException } from "@nestjs/common";
import { Repository } from "typeorm";

import {
  LocationDateOverrideRecord,
  LocationDateOverrideRepository,
} from "@domain/repositories/location-date-override.repository";

import { LocationDateOverrideOrmEntity } from "../orm-entities/location-date-override.orm-entity";

@Injectable()
export class LocationDateOverrideRepositoryImpl extends LocationDateOverrideRepository {
  constructor(
    @InjectRepository(LocationDateOverrideOrmEntity)
    private readonly repository: Repository<LocationDateOverrideOrmEntity>,
  ) {
    super();
  }

  async findByLocation(
    locationId: string,
    startDate?: string,
    endDate?: string,
  ): Promise<LocationDateOverrideRecord[]> {
    const query = this.repository
      .createQueryBuilder("override")
      .where("override.locationId = :locationId", { locationId });

    if (startDate) {
      query.andWhere("override.date >= :startDate", { startDate });
    }

    if (endDate) {
      query.andWhere("override.date <= :endDate", { endDate });
    }

    return query.orderBy("override.date", "ASC").getMany();
  }

  async findByIdForUpdate(
    locationId: string,
    id: string,
  ): Promise<LocationDateOverrideRecord | null> {
    return this.repository
      .createQueryBuilder("override")
      .setLock("pessimistic_write")
      .where("override.id = :id", { id })
      .andWhere("override.locationId = :locationId", { locationId })
      .getOne();
  }

  async create(override: {
    locationId: string;
    date: string;
    capacity: number | null;
    fee: string | null;
  }): Promise<LocationDateOverrideRecord> {
    try {
      const entity = this.repository.create(override);
      return await this.repository.save(entity);
    } catch (error) {
      this.throwIfDuplicateDate(error);
      throw error;
    }
  }

  async save(
    override: LocationDateOverrideRecord,
  ): Promise<LocationDateOverrideRecord> {
    const entity = this.repository.create(override);
    return this.repository.save(entity);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  private throwIfDuplicateDate(error: unknown): void {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "23505"
    ) {
      throw new ConflictException(
        "An override already exists for this location and date.",
      );
    }
  }
}
