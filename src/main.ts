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

  const isProduction = process.env.NODE_ENV === "production";

  const frontendOrigin = new URL(configService.getOrThrow("FRONTEND_URL"))
    .origin;

  const allowedOrigins = [
    frontendOrigin,
    "http://localhost:3000",
    "http://localhost:2892",
  ];

  app.setGlobalPrefix("api/permit");

  app.enableCors({
    origin: isProduction ? allowedOrigins : true,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  });

  app.enableShutdownHooks();

  app
    .getHttpAdapter()
    .getInstance()
    .set("trust proxy", configService.get("TRUST_PROXY", 1));

  app.use(helmet());

  // Enforce frontend-origin validation only in production.
  if (isProduction) {
    app.use((request: Request, response: Response, next: NextFunction) => {
      const safeMethods = ["GET", "HEAD", "OPTIONS"];

      if (safeMethods.includes(request.method)) {
        return next();
      }

      const origin = request.headers.origin;

      if (!origin || !allowedOrigins.includes(origin)) {
        return response.status(403).json({
          statusCode: 403,
          message: "Origin not allowed.",
        });
      }

      next();
    });
  }

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
    SwaggerModule.setup("api/permit/docs", app, document);
  }

  await app.listen(configService.get("PORT", 5001));
}

bootstrap();
