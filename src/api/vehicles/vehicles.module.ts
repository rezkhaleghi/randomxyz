import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";
import { AuthModule } from "@api/auth/auth.module";

import { VehiclesController } from "./vehicles.controller";

@Module({
  imports: [ApplicationModule, AuthModule],
  controllers: [VehiclesController],
})
export class VehiclesModule {}
