import { Passenger } from "@domain/entities/passenger.entity";

export abstract class PassengerRepository {
  abstract createMany(passengers: Passenger[]): Promise<Passenger[]>;

  abstract findByPermitId(permitId: string): Promise<Passenger[]>;

  abstract deleteByPermitId(permitId: string): Promise<void>;
}
