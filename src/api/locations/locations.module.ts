import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { LocationsController } from "./locations.controller";

import { ListLocationsUseCase } from "@application/use-cases/locations/list-locations.use-case";
import { GetLocationUseCase } from "@application/use-cases/locations/get-location.use-case";

@Module({
  imports: [ApplicationModule],
  controllers: [LocationsController],
  providers: [ListLocationsUseCase, GetLocationUseCase],
})
export class LocationsModule {}
