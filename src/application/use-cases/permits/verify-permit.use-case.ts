import { Injectable, NotFoundException } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class VerifyPermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(qrToken: string) {
    return this.unitOfWork.execute(async (repositories) => {
      const permit = await repositories.permitRepository.findByQrToken(qrToken);

      if (!permit) {
        throw new NotFoundException("Permit not found.");
      }

      const [location, passengers, vehicles] = await Promise.all([
        repositories.locationRepository.findById(permit.locationId),
        repositories.passengerRepository.findByPermitId(permit.id),
        repositories.vehicleRepository.findByPermitId(permit.id),
      ]);

      return {
        permitId: permit.id,
        status: permit.status,
        startDate: permit.startDate,
        endDate: permit.endDate,

        location: location
          ? {
              name: location.name,
              city: location.city,
              province: location.province,
            }
          : null,

        passengerCount: passengers.length,

        leaders: passengers
          .filter((passenger) => passenger.isLeader)
          .map((passenger) => ({
            fullName: passenger.fullName,
            nationalId: passenger.nationalId,
          })),

        vehicleCount: vehicles.length,

        vehicles: vehicles.map((vehicle) => ({
          kind: vehicle.kind,
          color: vehicle.color,
          plate: vehicle.plateId,
        })),
      };
    });
  }
}
