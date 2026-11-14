import { BadRequestException, Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { Passenger } from "@domain/entities/passenger.entity";

export interface CreatePassengerInput {
  userId: string;
  fullName: string;
  nationalId: string;
  isForeignNational?: boolean;
}

@Injectable()
export class CreatePassengerUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: CreatePassengerInput) {
    const fullName = input.fullName?.trim().toLowerCase();
    const nationalId = input.nationalId?.trim();

    if (
      !fullName ||
      !nationalId ||
      (input.isForeignNational !== undefined &&
        typeof input.isForeignNational !== "boolean")
    ) {
      throw new BadRequestException("Invalid passenger information.");
    }

    return this.unitOfWork.execute(async ({ passengerRepository }) => {
      const passenger = await passengerRepository.createIfNotExists(
        Passenger.create({
          userId: input.userId,
          fullName,
          nationalId,
          isForeignNational: input.isForeignNational ?? false,
        }),
      );

      return {
        id: passenger.id,
        fullName: passenger.fullName,
        nationalId: passenger.nationalId,
        isForeignNational: passenger.isForeignNational,
        createdAt: passenger.createdAt,
        updatedAt: passenger.updatedAt,
      };
    });
  }
}
