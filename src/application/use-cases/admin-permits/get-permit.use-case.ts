import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class AdminGetPermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(permitId: string) {
    return this.unitOfWork.execute(async (repositories) => {
      const permit = await repositories.permitRepository.findById(permitId);

      if (!permit) {
        throw new NotFoundException("Permit not found.");
      }

      const [passengers, vehicles] = await Promise.all([
        repositories.passengerRepository.findByPermitId(permit.id),
        repositories.vehicleRepository.findByPermitId(permit.id),
      ]);

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
        passengers,
        vehicles,
        createdAt: permit.createdAt,
        updatedAt: permit.updatedAt,
      };
    });
  }
}
