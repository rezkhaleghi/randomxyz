import { Permit } from "@domain/entities/permit.entity";

export abstract class PermitRepository {
  abstract create(permit: Permit): Promise<Permit>;

  abstract save(permit: Permit): Promise<Permit>;

  abstract findById(id: string): Promise<Permit | null>;

  abstract findByIdForUpdate(id: string): Promise<Permit | null>;

  abstract findByQrToken(qrToken: string): Promise<Permit | null>;

  abstract findByUserId(userId: string): Promise<Permit[]>;

  abstract countReservedPassengers(
    locationId: string,
    date: string,
    todayDate: string,
  ): Promise<number>;
}
