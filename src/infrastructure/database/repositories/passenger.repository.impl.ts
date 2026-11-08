import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";

import { Passenger } from "@domain/entities/passenger.entity";
import {
  PassengerAdminFilters,
  PassengerAdminRecord,
  PassengerRepository,
  PassengerSortBy,
} from "@domain/repositories/passenger.repository";

import { PageQuery, PageResult } from "@shared/pagination/page-query";

import { PassengerOrmEntity } from "../orm-entities/passenger.orm-entity";

@Injectable()
export class PassengerRepositoryImpl extends PassengerRepository {
  constructor(private readonly repository: Repository<PassengerOrmEntity>) {
    super();
  }

  async findByIdForUser(id: string, userId: string): Promise<Passenger | null> {
    const row = await this.repository.findOne({
      where: { id, userId },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUnique(
    userId: string,
    fullName: string,
    nationalId: string,
  ): Promise<Passenger | null> {
    const row = await this.repository.findOne({
      where: {
        userId,
        fullName: fullName.trim().toLowerCase(),
        nationalId: nationalId.trim(),
      },
    });

    return row ? this.toDomain(row) : null;
  }

  async createIfNotExists(passenger: Passenger): Promise<Passenger> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(PassengerOrmEntity)
      .values(this.toOrm(passenger))
      .orIgnore()
      .execute();

    const existing = await this.findByUnique(
      passenger.userId,
      passenger.fullName,
      passenger.nationalId,
    );

    if (!existing) {
      throw new Error("Passenger creation failed unexpectedly.");
    }

    return existing;
  }

  async save(passenger: Passenger): Promise<Passenger> {
    const saved = await this.repository.save(this.toOrm(passenger));
    return this.toDomain(saved);
  }

  async deleteByIdForUser(id: string, userId: string): Promise<boolean> {
    const result = await this.repository.delete({ id, userId });
    return (result.affected ?? 0) > 0;
  }

  async findUserPage(
    userId: string,
    search: string | undefined,
    params: PageQuery<PassengerSortBy>,
  ): Promise<PageResult<Passenger>> {
    const query = this.repository
      .createQueryBuilder("passenger")
      .where("passenger.userId = :userId", { userId });

    if (search?.trim()) {
      query.andWhere(
        `(
          passenger.fullName ILIKE :search
          OR passenger.nationalId ILIKE :search
        )`,
        { search: `%${search.trim()}%` },
      );
    }

    const columns: Record<PassengerSortBy, string> = {
      createdAt: "passenger.createdAt",
      fullName: "passenger.fullName",
    };

    query
      .orderBy(
        columns[params.sortBy ?? "createdAt"],
        params.sortDirection ?? "DESC",
      )
      .addOrderBy("passenger.id", "ASC")
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
    filters: PassengerAdminFilters,
    params: PageQuery<PassengerSortBy>,
  ): Promise<PageResult<PassengerAdminRecord>> {
    const query = this.repository
      .createQueryBuilder("passenger")
      .leftJoinAndSelect("passenger.user", "user");

    if (filters.userId) {
      query.andWhere("passenger.userId = :userId", {
        userId: filters.userId,
      });
    }

    if (filters.search?.trim()) {
      query.andWhere(
        `(
          passenger.fullName ILIKE :search
          OR passenger.nationalId ILIKE :search
          OR user.email ILIKE :search
          OR user.firstName ILIKE :search
          OR user.lastName ILIKE :search
        )`,
        { search: `%${filters.search.trim()}%` },
      );
    }

    const columns: Record<PassengerSortBy, string> = {
      createdAt: "passenger.createdAt",
      fullName: "passenger.fullName",
    };

    query
      .orderBy(
        columns[params.sortBy ?? "createdAt"],
        params.sortDirection ?? "DESC",
      )
      .addOrderBy("passenger.id", "ASC")
      .skip((params.page - 1) * params.limit)
      .take(params.limit);

    const [rows, total] = await query.getManyAndCount();

    return {
      data: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        fullName: row.fullName,
        nationalId: row.nationalId,
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

  private toDomain(row: PassengerOrmEntity): Passenger {
    return Passenger.restore({
      id: row.id,
      userId: row.userId,
      fullName: row.fullName,
      nationalId: row.nationalId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toOrm(passenger: Passenger): PassengerOrmEntity {
    const row = new PassengerOrmEntity();

    row.id = passenger.id;
    row.userId = passenger.userId;
    row.fullName = passenger.fullName;
    row.nationalId = passenger.nationalId;
    row.createdAt = passenger.createdAt;
    row.updatedAt = passenger.updatedAt;

    return row;
  }
}
