import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { LocationRepository } from "@domain/repositories/location.repository";
import { LocationDateOverrideRepository } from "@domain/repositories/location-date-override.repository";

export interface ListLocationDateOverridesInput {
  locationId: string;
  startDate?: string;
  endDate?: string;
}

@Injectable()
export class ListLocationDateOverridesUseCase {
  constructor(
    private readonly locationRepository: LocationRepository,
    private readonly overrideRepository: LocationDateOverrideRepository,
  ) {}

  async execute(input: ListLocationDateOverridesInput) {
    if (input.startDate && input.endDate && input.startDate > input.endDate) {
      throw new BadRequestException(
        "startDate must be before or equal to endDate.",
      );
    }

    const location = await this.locationRepository.findById(input.locationId);

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    return this.overrideRepository.findByLocation(
      input.locationId,
      input.startDate,
      input.endDate,
    );
  }
}
