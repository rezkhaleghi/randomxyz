import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface DeleteVehicleInput {
  id: string;
  userId: string;
}

@Injectable()
export class DeleteVehicleUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: DeleteVehicleInput) {
    return this.unitOfWork.execute(async ({ vehicleRepository }) => {
      const deleted = await vehicleRepository.deleteByIdForUser(
        input.id,
        input.userId,
      );

      if (!deleted) {
        throw new NotFoundException("Vehicle not found.");
      }

      return { success: true };
    });
  }
}
