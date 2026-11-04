import { Vehicle } from "@domain/entities/vehicle.entity";

export abstract class VehicleRepository {
  abstract createMany(vehicles: Vehicle[]): Promise<Vehicle[]>;

  abstract findByPermitId(permitId: string): Promise<Vehicle[]>;

  abstract deleteByPermitId(permitId: string): Promise<void>;
}
