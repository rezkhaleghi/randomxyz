import { Passenger } from "@domain/entities/passenger.entity";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

export type PassengerSortBy = "createdAt" | "fullName";

export interface PassengerAdminFilters {
  userId?: string;
  search?: string;
}

export interface PassengerAdminRecord {
  id: string;
  userId: string;
  fullName: string;
  nationalId: string;
  createdAt: Date;
  updatedAt: Date;
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
  };
}

export abstract class PassengerRepository {
  abstract findByIdForUser(
    id: string,
    userId: string,
  ): Promise<Passenger | null>;

  abstract findByUnique(
    userId: string,
    fullName: string,
    nationalId: string,
  ): Promise<Passenger | null>;

  abstract createIfNotExists(passenger: Passenger): Promise<Passenger>;

  abstract save(passenger: Passenger): Promise<Passenger>;

  abstract deleteByIdForUser(id: string, userId: string): Promise<boolean>;

  abstract findUserPage(
    userId: string,
    search: string | undefined,
    params: PageQuery<PassengerSortBy>,
  ): Promise<PageResult<Passenger>>;

  abstract findAdminPage(
    filters: PassengerAdminFilters,
    params: PageQuery<PassengerSortBy>,
  ): Promise<PageResult<PassengerAdminRecord>>;
}
