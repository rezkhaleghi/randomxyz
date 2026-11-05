import { Global, Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { TmarAuthGuard } from "./tmar-auth.guard";

@Global()
@Module({
  imports: [ApplicationModule],
  providers: [TmarAuthGuard],
  exports: [TmarAuthGuard],
})
export class AuthModule {}
