import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { DepositsController } from "./deposits.controller";
import { ParsianCallbackController } from "./parsian-callback.controller";

@Module({
  imports: [ApplicationModule],
  controllers: [DepositsController, ParsianCallbackController],
})
export class DepositsModule {}
