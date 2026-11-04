import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Passenger } from "@domain/entities/passenger.entity";
import { PassengerRepository } from "@domain/repositories/passenger.repository";

import { PassengerOrmEntity } from "../orm-entities/passenger.orm-entity";

@Injectable()
export class PassengerRepositoryImpl extends PassengerRepository {
  constructor(
    @InjectRepository(PassengerOrmEntity)
    private readonly repository: Repository<PassengerOrmEntity>,
  ) {
    super();
  }

  async createMany(passengers: Passenger[]): Promise<Passenger[]> {
    if (passengers.length === 0) {
      return [];
    }

    const rows = passengers.map((passenger) => this.toOrm(passenger));
    const saved = await this.repository.save(rows);

    return saved.map((row) => this.toDomain(row));
  }

  async findByPermitId(permitId: string): Promise<Passenger[]> {
    const rows = await this.repository.find({
      where: { permitId },
      order: { createdAt: "ASC" },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async deleteByPermitId(permitId: string): Promise<void> {
    await this.repository.delete({ permitId });
  }

  private toDomain(row: PassengerOrmEntity): Passenger {
    return Passenger.restore({
      id: row.id,
      permitId: row.permitId,
      fullName: row.fullName,
      nationalId: row.nationalId,
      isLeader: row.isLeader,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  private toOrm(passenger: Passenger): PassengerOrmEntity {
    const row = new PassengerOrmEntity();

    row.id = passenger.id;
    row.permitId = passenger.permitId;
    row.fullName = passenger.fullName;
    row.nationalId = passenger.nationalId;
    row.isLeader = passenger.isLeader;
    row.createdAt = passenger.createdAt;
    row.updatedAt = passenger.updatedAt;

    return row;
  }
}
