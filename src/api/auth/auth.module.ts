import { Global, Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { AuthController } from "./auth.controller";
import { TmarAuthGuard } from "./tmar-auth.guard";

@Global()
@Module({
  imports: [ApplicationModule],
  controllers: [AuthController],
  providers: [TmarAuthGuard],
  exports: [TmarAuthGuard],
})
export class AuthModule {}
