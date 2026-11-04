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
    return this.unitOfWork.execute(async (repositories) => {
      const permit = await repositories.permitRepository.findById(
        input.permitId,
      );

      if (!permit || permit.userId !== input.userId) {
        throw new NotFoundException("Permit not found.");
      }

      const [passengers, vehicles] = await Promise.all([
        repositories.passengerRepository.findByPermitId(permit.id),
        repositories.vehicleRepository.findByPermitId(permit.id),
      ]);

      return {
        id: permit.id,
        locationId: permit.locationId,
        startDate: permit.startDate,
        endDate: permit.endDate,
        status: permit.status,
        totalAmount: permit.totalAmount,
        currency: permit.currency,
        qrToken: permit.qrToken,
        passengers: passengers.map((passenger) => ({
          id: passenger.id,
          fullName: passenger.fullName,
          nationalId: passenger.nationalId,
          isLeader: passenger.isLeader,
        })),
        vehicles: vehicles.map((vehicle) => ({
          id: vehicle.id,
          kind: vehicle.kind,
          color: vehicle.color,
          plateId: vehicle.plateId,
        })),
        createdAt: permit.createdAt,
        updatedAt: permit.updatedAt,
      };
    });
  }
}
