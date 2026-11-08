import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

export interface GetPermitInput {
  userId: string;
  permitId: string;
}

@Injectable()
export class GetPermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: GetPermitInput) {
    return this.unitOfWork.execute(async ({ permitRepository }) => {
      const permit = await permitRepository.findById(input.permitId);

      if (!permit || permit.userId !== input.userId) {
        throw new NotFoundException("Permit not found.");
      }

      return {
        id: permit.id,
        locationId: permit.locationId,
        startDate: permit.startDate,
        endDate: permit.endDate,
        status: permit.status,
        totalAmount: permit.totalAmount,
        currency: permit.currency,
        qrToken: permit.qrToken,
        passengers: permit.passengers,
        vehicles: permit.vehicles,
        createdAt: permit.createdAt,
        updatedAt: permit.updatedAt,
      };
    });
  }
}
