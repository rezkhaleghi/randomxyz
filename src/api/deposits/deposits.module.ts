import { Module } from "@nestjs/common";

import { ApplicationModule } from "@application/application.module";

import { DepositsController } from "./deposits.controller";
import { CallbackController } from "./callback.controller";

import { HandleFakeCallbackUseCase } from "@application/use-cases/deposits/handle-fake-callback.use-case";

@Module({
  imports: [ApplicationModule],
  controllers: [DepositsController, CallbackController],
  providers: [HandleFakeCallbackUseCase],
})
export class DepositsModule {}
