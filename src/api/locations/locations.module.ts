import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { LocationsController } from "./locations.controller";

@Module({
  imports: [ApplicationModule],
  controllers: [LocationsController],
})
export class LocationsModule {}
