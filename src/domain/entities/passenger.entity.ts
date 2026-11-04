import { randomUUID } from "crypto";

export interface CreatePassengerProps {
  id?: string;
  permitId: string;
  fullName: string;
  nationalId: string;
  isLeader: boolean;
}

export interface RestorePassengerProps {
  id: string;
  permitId: string;
  fullName: string;
  nationalId: string;
  isLeader: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Passenger {
  private constructor(
    public readonly id: string,
    public readonly permitId: string,
    public readonly fullName: string,
    public readonly nationalId: string,
    public readonly isLeader: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreatePassengerProps): Passenger {
    const now = new Date();

    return new Passenger(
      props.id ?? randomUUID(),
      props.permitId,
      props.fullName,
      props.nationalId,
      props.isLeader,
      now,
      now,
    );
  }

  static restore(props: RestorePassengerProps): Passenger {
    return new Passenger(
      props.id,
      props.permitId,
      props.fullName,
      props.nationalId,
      props.isLeader,
      props.createdAt,
      props.updatedAt,
    );
  }
}
