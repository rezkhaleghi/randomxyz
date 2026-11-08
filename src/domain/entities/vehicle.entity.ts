import { randomUUID } from "crypto";

export interface CreateVehicleProps {
  id?: string;
  userId: string;
  kind: string;
  color: string;
  plateId: string;
}

export interface RestoreVehicleProps {
  id: string;
  userId: string;
  kind: string;
  color: string;
  plateId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Vehicle {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public kind: string,
    public color: string,
    public plateId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: CreateVehicleProps): Vehicle {
    const now = new Date();

    return new Vehicle(
      props.id ?? randomUUID(),
      props.userId,
      props.kind.trim(),
      props.color.trim(),
      props.plateId.trim(),
      now,
      now,
    );
  }

  static restore(props: RestoreVehicleProps): Vehicle {
    return new Vehicle(
      props.id,
      props.userId,
      props.kind,
      props.color,
      props.plateId,
      props.createdAt,
      props.updatedAt,
    );
  }

  update(props: { kind: string; color: string; plateId: string }): void {
    this.kind = props.kind.trim();
    this.color = props.color.trim();
    this.plateId = props.plateId.trim();
    this.updatedAt = new Date();
  }
}
