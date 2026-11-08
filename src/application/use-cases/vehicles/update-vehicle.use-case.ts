import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface UpdateVehicleInput {
  id: string;
  userId: string;
  kind: string;
  color: string;
  plateId: string;
}

@Injectable()
export class UpdateVehicleUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdateVehicleInput) {
    const kind = input.kind?.trim();
    const color = input.color?.trim();
    const plateId = input.plateId?.trim();

    if (!kind || !color || !plateId) {
      throw new BadRequestException("Invalid vehicle information.");
    }

    return this.unitOfWork.execute(async ({ vehicleRepository }) => {
      const vehicle = await vehicleRepository.findByIdForUser(
        input.id,
        input.userId,
      );

      if (!vehicle) {
        throw new NotFoundException("Vehicle not found.");
      }

      const duplicate = await vehicleRepository.findByUnique(
        input.userId,
        kind,
        color,
        plateId,
      );

      if (duplicate && duplicate.id !== vehicle.id) {
        throw new ConflictException(
          "A vehicle with these details already exists.",
        );
      }

      vehicle.update({ kind, color, plateId });

      const saved = await vehicleRepository.save(vehicle);

      return {
        id: saved.id,
        kind: saved.kind,
        color: saved.color,
        plateId: saved.plateId,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    });
  }
}
