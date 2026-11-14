import { randomUUID } from "crypto";

export interface CreatePassengerProps {
  id?: string;
  userId: string;
  fullName: string;
  nationalId: string;
  isForeignNational?: boolean;
}

export interface RestorePassengerProps {
  id: string;
  userId: string;
  fullName: string;
  nationalId: string;
  isForeignNational?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Passenger {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public fullName: string,
    public nationalId: string,
    public isForeignNational: boolean,
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
      props.isForeignNational ?? false,
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
      props.isForeignNational ?? false,
      props.createdAt,
      props.updatedAt,
    );
  }

  update(props: {
    fullName: string;
    nationalId: string;
    isForeignNational?: boolean;
  }): void {
    this.fullName = props.fullName.trim().toLowerCase();
    this.nationalId = props.nationalId.trim();

    if (props.isForeignNational !== undefined) {
      this.isForeignNational = props.isForeignNational;
    }

    this.updatedAt = new Date();
  }
}
