import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { Vehicle } from "@domain/entities/vehicle.entity";
import {
  VehicleAdminFilters,
  VehicleAdminRecord,
  VehicleRepository,
  VehicleSortBy,
} from "@domain/repositories/vehicle.repository";

import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { VehicleOrmEntity } from "../orm-entities/vehicle.orm-entity";

@Injectable()
export class VehicleRepositoryImpl extends VehicleRepository {
  constructor(private readonly repository: Repository<VehicleOrmEntity>) {
    super();
  }

  async findByIdForUser(id: string, userId: string): Promise<Vehicle | null> {
    const row = await this.repository.findOne({
      where: { id, userId },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUnique(
    userId: string,
    kind: string,
    color: string,
    plateId: string,
  ): Promise<Vehicle | null> {
    const row = await this.repository.findOne({
      where: {
        userId,
        kind: kind.trim(),
        color: color.trim(),
        plateId: plateId.trim(),
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async createIfNotExists(vehicle: Vehicle): Promise<Vehicle> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(VehicleOrmEntity)
      .values(this.toOrm(vehicle))
      .orIgnore()
      .execute();

    const existing = await this.findByUnique(
      vehicle.userId,
      vehicle.kind,
      vehicle.color,
      vehicle.plateId,
    );

    if (!existing) {
      throw new Error("Vehicle creation failed unexpectedly.");
    }

    return existing;
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const saved = await this.repository.save(this.toOrm(vehicle));
    return this.toDomain(saved);
  }

  async deleteByIdForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  async findUserPage(
    userId: string,
    search: string | undefined,
    params: PageQuery<VehicleSortBy>,
  ): Promise<PageResult<Vehicle>> {
    const query = this.repository
      .createQueryBuilder("vehicle")
      .where("vehicle.userId = :userId", { userId });

    if (search?.trim()) {
      query.andWhere(
        `(
          vehicle.kind ILIKE :search
          OR vehicle.color ILIKE :search
          OR vehicle.plateId ILIKE :search
        )`,
        { search: `%${search.trim()}%` },
      );
    }

    const columns: Record<VehicleSortBy, string> = {
      createdAt: "vehicle.createdAt",
      kind: "vehicle.kind",
      plateId: "vehicle.plateId",
    };

    query
      .orderBy(
        columns[params.sortBy ?? "createdAt"],
        params.sortDirection ?? "DESC",
      )
      .addOrderBy("vehicle.id", "ASC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit);

    const [rows, total] = await query.getManyAndCount();

    return {
      data: rows.map((row) => this.toDomain(row)),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  async findAdminPage(
    filters: VehicleAdminFilters,
    params: PageQuery<VehicleSortBy>,
  ): Promise<PageResult<VehicleAdminRecord>> {
    const query = this.repository
      .createQueryBuilder("vehicle")
      .leftJoinAndSelect("vehicle.user", "user");

    if (filters.userId) {
      query.andWhere("vehicle.userId = :userId", {
        userId: filters.userId,
      });
    }

    if (filters.search?.trim()) {
      query.andWhere(
        `(
          vehicle.kind ILIKE :search
          OR vehicle.color ILIKE :search
          OR vehicle.plateId ILIKE :search
          OR user.email ILIKE :search
          OR user.firstName ILIKE :search
          OR user.lastName ILIKE :search
        )`,
        { search: `%${filters.search.trim()}%` },
      );
    }

    const columns: Record<VehicleSortBy, string> = {
      createdAt: "vehicle.createdAt",
      kind: "vehicle.kind",
      plateId: "vehicle.plateId",
    };

    query
      .orderBy(
        columns[params.sortBy ?? "createdAt"],
        params.sortDirection ?? "DESC",
      )
      .addOrderBy("vehicle.id", "ASC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit);

    const [rows, total] = await query.getManyAndCount();

    return {
      data: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        kind: row.kind,
        color: row.color,
        plateId: row.plateId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        user: {
          id: row.user.id,
          firstName: row.user.firstName,
          lastName: row.user.lastName,
          email: row.user.email,
        },
      })),
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    };
  }

  private toDomain(row: VehicleOrmEntity): Vehicle {
    return Vehicle.restore({
      id: row.id,
      userId: row.userId,
      kind: row.kind,
      color: row.color,
      plateId: row.plateId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toOrm(vehicle: Vehicle): VehicleOrmEntity {
    const row = new VehicleOrmEntity();

    row.id = vehicle.id;
    row.userId = vehicle.userId;
    row.kind = vehicle.kind;
    row.color = vehicle.color;
    row.plateId = vehicle.plateId;
    row.createdAt = vehicle.createdAt;
    row.updatedAt = vehicle.updatedAt;

    return row;
  }
}
