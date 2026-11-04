import { Injectable, NotFoundException } from "@nestjs/common";

import { LocationRecord } from "@domain/repositories/location.repository";
import { LocationRepository } from "@domain/repositories/location.repository";

@Injectable()
export class AdminGetLocationUseCase {
  constructor(private readonly locationRepository: LocationRepository) {}

  async execute(id: string): Promise<LocationRecord> {
    const location = await this.locationRepository.findById(id);

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    return location;
  }
}
