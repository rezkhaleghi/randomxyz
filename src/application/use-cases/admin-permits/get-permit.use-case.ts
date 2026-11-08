import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class AdminGetPermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(permitId: string) {
    return this.unitOfWork.execute(async ({ permitRepository }) => {
      const permit = await permitRepository.findById(permitId);

      if (!permit) {
        throw new NotFoundException("Permit not found.");
      }

      return {
        id: permit.id,
        userId: permit.userId,
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
