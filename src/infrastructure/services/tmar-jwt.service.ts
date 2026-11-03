import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";

import { TmarIdentity } from "@application/interfaces/tmar-identity.interface";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

@Injectable()
export class TmarJwtService {
  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {}

  verify(token: string): TmarIdentity {
    try {
      const payload = jwt.verify(
        token,
        this.configService.getOrThrow("TMAR_JWT_SECRET"),
        {
          algorithms: ["HS256"],
        },
      );

      if (
        typeof payload === "string" ||
        !Number.isInteger(payload.exp) ||
        typeof payload._id !== "string" ||
        !payload._id.trim() ||
        typeof payload.email !== "string" ||
        !payload.email.trim()
      ) {
        throw new Error("Invalid authentication token payload.");
      }

      return {
        _id: payload._id.trim(),
        email: payload.email.trim().toLowerCase(),
        firstName:
          typeof payload.firstName === "string"
            ? payload.firstName.trim()
            : null,
        lastName:
          typeof payload.lastName === "string" ? payload.lastName.trim() : null,
      };
    } catch {
      throw new UnauthorizedException(
        "Invalid or expired authentication token.",
      );
    }
  }
}
