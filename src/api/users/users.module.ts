import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { AuthModule } from "../auth/auth.module";
import { UsersController } from "./users.controller";

@Module({
  imports: [ApplicationModule, AuthModule],
  controllers: [UsersController],
})
export class UsersModule {}
