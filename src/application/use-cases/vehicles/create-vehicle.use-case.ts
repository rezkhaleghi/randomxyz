import { BadRequestException, Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { Vehicle } from "@domain/entities/vehicle.entity";

export interface CreateVehicleInput {
  userId: string;
  kind: string;
  color: string;
  plateId: string;
}

@Injectable()
export class CreateVehicleUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreateVehicleInput) {
    const kind = input.kind?.trim();
    const color = input.color?.trim();
    const plateId = input.plateId?.trim();

    if (!kind || !color || !plateId) {
      throw new BadRequestException("Invalid vehicle information.");
    }

    return this.unitOfWork.execute(async ({ vehicleRepository }) => {
      const vehicle = await vehicleRepository.createIfNotExists(
        Vehicle.create({
          userId: input.userId,
          kind,
          color,
          plateId,
        }),
      );

      return {
        id: vehicle.id,
        kind: vehicle.kind,
        color: vehicle.color,
        plateId: vehicle.plateId,
        createdAt: vehicle.createdAt,
        updatedAt: vehicle.updatedAt,
      };
    });
  }
}
