import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface DeletePassengerInput {
  id: string;
  userId: string;
}

@Injectable()
export class DeletePassengerUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: DeletePassengerInput) {
    return this.unitOfWork.execute(async ({ passengerRepository }) => {
      const deleted = await passengerRepository.deleteByIdForUser(
        input.id,
        input.userId,
      );

      if (!deleted) {
        throw new NotFoundException("Passenger not found.");
      }

      return { success: true };
    });
  }
}
