import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class ListPermitsUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(userId: string) {
    return this.unitOfWork.execute(async ({ permitRepository }) => {
      const permits = await permitRepository.findByUserId(userId);

      return permits.map((permit) => ({
        id: permit.id,
        locationId: permit.locationId,
        startDate: permit.startDate,
        endDate: permit.endDate,
        status: permit.status,
        totalAmount: permit.totalAmount,
        currency: permit.currency,
        createdAt: permit.createdAt,
      }));
    });
  }
}
