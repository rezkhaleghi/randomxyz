import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Vehicle } from "@domain/entities/vehicle.entity";
import { VehicleRepository } from "@domain/repositories/vehicle.repository";

import { VehicleOrmEntity } from "../orm-entities/vehicle.orm-entity";

@Injectable()
export class VehicleRepositoryImpl extends VehicleRepository {
  constructor(
    @InjectRepository(VehicleOrmEntity)
    private readonly repository: Repository<VehicleOrmEntity>,
  ) {
    super();
  }

  async createMany(vehicles: Vehicle[]): Promise<Vehicle[]> {
    if (vehicles.length === 0) {
      return [];
    }

    const rows = vehicles.map((vehicle) => this.toOrm(vehicle));
    const saved = await this.repository.save(rows);

    return saved.map((row) => this.toDomain(row));
  }

  async findByPermitId(permitId: string): Promise<Vehicle[]> {
    const rows = await this.repository.find({
      where: { permitId },
      order: { createdAt: "ASC" },
    });

    return rows.map((row) => this.toDomain(row));
  }

  async deleteByPermitId(permitId: string): Promise<void> {
    await this.repository.delete({ permitId });
  }

  private toDomain(row: VehicleOrmEntity): Vehicle {
    return Vehicle.restore({
      id: row.id,
      permitId: row.permitId,
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
    row.permitId = vehicle.permitId;
    row.kind = vehicle.kind;
    row.color = vehicle.color;
    row.plateId = vehicle.plateId;
    row.createdAt = vehicle.createdAt;
    row.updatedAt = vehicle.updatedAt;

    return row;
  }
}
