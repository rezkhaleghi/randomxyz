import { randomUUID } from "crypto";

export interface CreatePassengerProps {
  id?: string;
  userId: string;
  fullName: string;
  nationalId: string;
}

export interface RestorePassengerProps {
  id: string;
  userId: string;
  fullName: string;
  nationalId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Passenger {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public fullName: string,
    public nationalId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: CreatePassengerProps): Passenger {
    const now = new Date();

    return new Passenger(
      props.id ?? randomUUID(),
      props.userId,
      props.fullName.trim().toLowerCase(),
      props.nationalId.trim(),
      now,
      now,
    );
  }

  static restore(props: RestorePassengerProps): Passenger {
    return new Passenger(
      props.id,
      props.userId,
      props.fullName,
      props.nationalId,
      props.createdAt,
      props.updatedAt,
    );
  }

  update(props: { fullName: string; nationalId: string }): void {
    this.fullName = props.fullName.trim().toLowerCase();
    this.nationalId = props.nationalId.trim();
    this.updatedAt = new Date();
  }
}
