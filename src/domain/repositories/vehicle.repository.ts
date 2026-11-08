import { Vehicle } from "@domain/entities/vehicle.entity";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

export type VehicleSortBy = "createdAt" | "kind" | "plateId";

export interface VehicleAdminFilters {
  userId?: string;
  search?: string;
}

export interface VehicleAdminRecord {
  id: string;
  userId: string;
  kind: string;
  color: string;
  plateId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export abstract class VehicleRepository {
  abstract findByIdForUser(id: string, userId: string): Promise<Vehicle | null>;

  abstract findByUnique(
    userId: string,
    kind: string,
    color: string,
    plateId: string,
  ): Promise<Vehicle | null>;

  abstract createIfNotExists(vehicle: Vehicle): Promise<Vehicle>;

  abstract save(vehicle: Vehicle): Promise<Vehicle>;

  abstract deleteByIdForUser(id: string, userId: string): Promise<boolean>;

  abstract findUserPage(
    userId: string,
    search: string | undefined,
    params: PageQuery<VehicleSortBy>,
  ): Promise<PageResult<Vehicle>>;

  abstract findAdminPage(
    filters: VehicleAdminFilters,
    params: PageQuery<VehicleSortBy>,
  ): Promise<PageResult<VehicleAdminRecord>>;
}
