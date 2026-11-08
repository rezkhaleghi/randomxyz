import { BadRequestException, Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { Passenger } from "@domain/entities/passenger.entity";

export interface CreatePassengerInput {
  userId: string;
  fullName: string;
  nationalId: string;
}

@Injectable()
export class CreatePassengerUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreatePassengerInput) {
    const fullName = input.fullName?.trim().toLowerCase();
    const nationalId = input.nationalId?.trim();

    if (!fullName || !nationalId) {
      throw new BadRequestException("Invalid passenger information.");
    }

    return this.unitOfWork.execute(async ({ passengerRepository }) => {
      const passenger = await passengerRepository.createIfNotExists(
        Passenger.create({
          userId: input.userId,
          fullName,
          nationalId,
        }),
      );

      return {
        id: passenger.id,
        fullName: passenger.fullName,
        nationalId: passenger.nationalId,
        createdAt: passenger.createdAt,
        updatedAt: passenger.updatedAt,
      };
    });
  }
}
