import { randomUUID } from "crypto";

export interface CreateVehicleProps {
  id?: string;
  permitId: string;
  kind: string;
  color: string;
  plateId: string;
}

export interface RestoreVehicleProps {
  id: string;
  permitId: string;
  kind: string;
  color: string;
  plateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Vehicle {
  private constructor(
    public readonly id: string,
    public readonly permitId: string,
    public readonly kind: string,
    public readonly color: string,
    public readonly plateId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static create(props: CreateVehicleProps): Vehicle {
    const now = new Date();

    return new Vehicle(
      props.id ?? randomUUID(),
      props.permitId,
      props.kind,
      props.color,
      props.plateId,
      now,
      now,
    );
  }

  static restore(props: RestoreVehicleProps): Vehicle {
    return new Vehicle(
      props.id,
      props.permitId,
      props.kind,
      props.color,
      props.plateId,
      props.createdAt,
      props.updatedAt,
    );
  }
}
