import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";
import { AuthModule } from "@api/auth/auth.module";

import { PassengersController } from "./passengers.controller";

@Module({
  imports: [ApplicationModule, AuthModule],
  controllers: [PassengersController],
})
export class PassengersModule {}
