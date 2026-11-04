import { HttpExceptionFilter } from "./api/http-exception.filter";
import { randomUUID } from "crypto";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import type { Request, Response } from "express";

import { AppModule } from "./app.module";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

/**
 * Application bootstrap function.
 *
 * Creates the NestJS application, configures global middleware,
 * validation, exception handling, Swagger, and starts the HTTP server.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("HTTP");

  const configService = app.get(ConfigService<EnvironmentConfig>);

  app.enableShutdownHooks();

  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", configService.get("TRUST_PROXY", 1));

  app.enableCors({
    origin: configService.getOrThrow("FRONTEND_URL"),
    credentials: true,
  });

  app.use(helmet());

  /**
   * Generate a server-side correlation ID for every request.
   */
  app.use((request: Request, response: Response, next: () => void) => {
    const requestId = randomUUID();

    response.setHeader("X-Request-Id", requestId);

    (request as Request & { requestId: string }).requestId = requestId;

    next();
  });

  /**
   * Log completed requests without logging credentials or personal data.
   */
  app.use((request: Request, response: Response, next: () => void) => {
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
