import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { AuthModule } from "../auth/auth.module";
import { PermitsController } from "./permits.controller";

@Module({
  imports: [ApplicationModule, AuthModule],
  controllers: [PermitsController],
})
export class PermitsModule {}
