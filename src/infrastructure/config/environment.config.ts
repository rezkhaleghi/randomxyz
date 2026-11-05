/**
 * Compile-time contract for all environment configuration used by the app.
 *
 * Runtime validation is handled by Joi in InfrastructureModule.
 */
export interface EnvironmentConfig {
  // Application
  NODE_ENV: "development" | "test" | "production";
  PORT: number;
  TRUST_PROXY: number;
  FRONTEND_URL: string;
  BACKEND_URL: string;
  SWAGGER_ENABLED: boolean;
  DEFAULT_CURRENCY: string;

  // PostgreSQL
  DB_HOST: string;
  DB_PORT: number;
  DB_USERNAME: string;
  DB_PASSWORD: string;
  DB_NAME: string;

  // SMTP notifications
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USER: string;
  SMTP_PASSWORD: string;
  SMTP_FROM: string;

  // TmarTravel authentication and integration
  TMAR_JWT_SECRET: string;
  TMAR_TRAVEL_API_URL: string;

  // Parsian payment gateway
  PARSIAN_PIN: string;
  PARSIAN_SALE_URL: string;
  PARSIAN_CONFIRM_URL: string;
}
