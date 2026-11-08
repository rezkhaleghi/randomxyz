import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface UpdatePassengerInput {
  id: string;
  userId: string;
  fullName: string;
  nationalId: string;
}

@Injectable()
export class UpdatePassengerUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: UpdatePassengerInput) {
    const fullName = input.fullName?.trim().toLowerCase();
    const nationalId = input.nationalId?.trim();

    if (!fullName || !nationalId) {
      throw new BadRequestException("Invalid passenger information.");
    }

    return this.unitOfWork.execute(async ({ passengerRepository }) => {
      const passenger = await passengerRepository.findByIdForUser(
        input.id,
        input.userId,
      );

      if (!passenger) {
        throw new NotFoundException("Passenger not found.");
      }

      const duplicate = await passengerRepository.findByUnique(
        input.userId,
        fullName,
        nationalId,
      );

      if (duplicate && duplicate.id !== passenger.id) {
        throw new ConflictException(
          "A passenger with these details already exists.",
        );
      }

      passenger.update({ fullName, nationalId });

      const saved = await passengerRepository.save(passenger);

      return {
        id: saved.id,
        fullName: saved.fullName,
        nationalId: saved.nationalId,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    });
  }
}
