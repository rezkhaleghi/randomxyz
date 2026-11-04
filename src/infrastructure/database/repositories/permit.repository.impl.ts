import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Permit } from "@domain/entities/permit.entity";
import { PermitStatus } from "@domain/enums/permit-status.enum";
import { PermitRepository } from "@domain/repositories/permit.repository";

import { PassengerOrmEntity } from "../orm-entities/passenger.orm-entity";
import { PermitOrmEntity } from "../orm-entities/permit.orm-entity";

@Injectable()
export class PermitRepositoryImpl extends PermitRepository {
  constructor(
    @InjectRepository(PermitOrmEntity)
    private readonly repository: Repository<PermitOrmEntity>,
  ) {
    super();
  }

  async create(permit: Permit): Promise<Permit> {
    const saved = await this.repository.save(this.toOrm(permit));

    return this.toDomain(saved);
  }

  async save(permit: Permit): Promise<Permit> {
    const saved = await this.repository.save(this.toOrm(permit));

    return this.toDomain(saved);
  }

  async findById(id: string): Promise<Permit | null> {
    const row = await this.repository.findOne({
      where: { id },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string): Promise<Permit | null> {
    const row = await this.repository.findOne({
      where: { id },
      lock: { mode: "pessimistic_write" },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByQrToken(qrToken: string): Promise<Permit | null> {
    const row = await this.repository.findOne({
      where: { qrToken },
    });

    return row ? this.toDomain(row) : null;
  }

  async findByUserId(userId: string): Promise<Permit[]> {
    const rows = await this.repository.find({
      where: { userId },
      order: { createdAt: "DESC" },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async countReservedPassengers(
    locationId: string,
    date: string,
    todayDate: string,
  ): Promise<number> {
    const result = await this.repository
      .createQueryBuilder("permit")
      .innerJoin(
        PassengerOrmEntity,
        "passenger",
        "passenger.permitId = permit.id",
      )
      .select("COUNT(passenger.id)", "count")
      .where("permit.locationId = :locationId", { locationId })
      .andWhere(
        `(
          (
            permit.status = :confirmedStatus
            AND permit.startDate <= :date
            AND permit.endDate >= :date
          )
          OR
          (
            permit.status = :expiredStatus
            AND :date = :todayDate
          )
        )`,
        {
          confirmedStatus: PermitStatus.CONFIRMED,
          expiredStatus: PermitStatus.EXPIRED,
          date,
          todayDate,
        },
      )
      .getRawOne<{ count: string }>();

    return Number(result?.count ?? 0);
  }

  private toDomain(row: PermitOrmEntity): Permit {
    return Permit.restore({
      id: row.id,
      userId: row.userId,
      locationId: row.locationId,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      totalAmount: row.totalAmount,
      currency: row.currency,
      qrToken: row.qrToken,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toOrm(permit: Permit): PermitOrmEntity {
    const row = new PermitOrmEntity();

    row.id = permit.id;
    row.userId = permit.userId;
    row.locationId = permit.locationId;
    row.startDate = permit.startDate;
    row.endDate = permit.endDate;
    row.status = permit.status;
    row.totalAmount = permit.totalAmount;
    row.currency = permit.currency;
    row.qrToken = permit.qrToken;
    row.createdAt = permit.createdAt;
    row.updatedAt = permit.updatedAt;

    return row;
  }
}
