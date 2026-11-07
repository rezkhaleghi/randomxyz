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
    const frontendUrl = this.configService
      .getOrThrow("FRONTEND_URL")
      .replace(/\/+$/, "");

    const redirectUrl = new URL(
      "/trip-permit/wallet?tab=deposits",
      `${frontendUrl}/`,
    );

    try {
      await this.handleParsianCallbackUseCase.execute(body);

      response.redirect(303, redirectUrl.toString());
    } catch {
      this.logger.warn("Parsian callback could not be verified.");

      // Keep the user on the deposits tab even when verification fails.
      redirectUrl.searchParams.set("paymentStatus", "verification_failed");

      response.redirect(303, redirectUrl.toString());
    }
  }
}
