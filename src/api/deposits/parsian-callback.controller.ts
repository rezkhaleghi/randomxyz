import { Body, Controller, Logger, Post, Res } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Response } from "express";

import { EnvironmentConfig } from "@infrastructure/config/environment.config";
import { HandleParsianCallbackUseCase } from "@application/use-cases/deposits/handle-parsian-callback.use-case";

@Controller("deposits/parsian")
export class ParsianCallbackController {
  private readonly logger = new Logger(ParsianCallbackController.name);

  constructor(
    private readonly handleParsianCallbackUseCase: HandleParsianCallbackUseCase,
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {}

  @Post("callback")
  async callback(
    @Body() body: Record<string, unknown>,
    @Res() response: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.getOrThrow("FRONTEND_URL");
    const redirectUrl = new URL("/", frontendUrl);

    try {
      const deposit = await this.handleParsianCallbackUseCase.execute(body);

      redirectUrl.searchParams.set("depositId", deposit.id);
      redirectUrl.searchParams.set("depositStatus", deposit.status);

      response.redirect(303, redirectUrl.toString());
    } catch {
      // Do not expose callback validation or SOAP details to the browser.
      this.logger.warn("Parsian callback could not be verified.");

      redirectUrl.searchParams.set("depositStatus", "verification_failed");

      response.redirect(303, redirectUrl.toString());
    }
  }
}
