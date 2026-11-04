import { HttpExceptionFilter } from "./api/http-exception.filter";
import { randomUUID } from "crypto";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import type { Request, Response, NextFunction } from "express";

import { AppModule } from "./app.module";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("HTTP");

  const configService = app.get(ConfigService<EnvironmentConfig>);
  const frontendOrigin = new URL(configService.getOrThrow("FRONTEND_URL"))
    .origin;

  app.enableShutdownHooks();

  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", configService.get("TRUST_PROXY", 1));

  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
  });

  app.use(helmet());

  /**
   * Reject cross-origin state-changing requests.
   *
   * The frontend is the only trusted browser origin.
   * Safe methods are not subject to this check.
   */
  app.use((request: Request, response: Response, next: NextFunction) => {
    const safeMethods = ["GET", "HEAD", "OPTIONS"];

    if (safeMethods.includes(request.method)) {
      return next();
    }

    const origin = request.headers.origin;

    if (origin !== frontendOrigin) {
      return response.status(403).json({
        statusCode: 403,
        message: "Origin not allowed.",
      });
    }

    next();
  });

  app.use((request: Request, response: Response, next: NextFunction) => {
    const requestId = randomUUID();

    response.setHeader("X-Request-Id", requestId);

    (request as Request & { requestId: string }).requestId = requestId;

    next();
  });

  app.use((request: Request, response: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    const requestId =
      (request as Request & { requestId?: string }).requestId ?? "unknown";

    response.on("finish", () => {
      const durationMs =
        Number(process.hrtime.bigint() - startedAt) / 1_000_000;

      logger.log(
        `${request.method} ${request.path} ${response.statusCode} ${durationMs.toFixed(1)}ms requestId=${requestId}`,
      );
    });

    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  const swaggerEnabled = configService.get("SWAGGER_ENABLED");

  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle("API")
      .setDescription("Tmar-Cert backend API documentation")
      .setVersion("1.0")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
  }

  await app.listen(configService.get("PORT", 5001));
}

bootstrap();
