import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { User } from "@domain/entities/user.entity";

import { TmarAuthUseCase } from "@application/use-cases/auth/tmar-auth.use-case";
import { TmarTokenVerifier } from "@application/interfaces/tmar-token-verifier.interface";

type AuthenticatedRequest = Request & {
  user?: User;
};

@Injectable()
export class TmarAuthGuard implements CanActivate {
  constructor(
    private readonly tokenVerifier: TmarTokenVerifier,
    private readonly tmarAuthUseCase: TmarAuthUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token = this.extractAccessToken(request);

    const identity = this.tokenVerifier.verify(token);
    const user = await this.tmarAuthUseCase.execute(identity);

    request.user = user;

    return true;
  }

  private extractAccessToken(request: Request): string {
    const cookieHeader = request.headers.cookie;

    if (!cookieHeader) {
      throw new UnauthorizedException("Authentication required.");
    }

    const matchingCookies = cookieHeader
      .split(";")
      .map((cookie) => cookie.trim())
      .filter((cookie) => cookie.startsWith("accessToken="));

    if (matchingCookies.length !== 1) {
      throw new UnauthorizedException("Authentication required.");
    }

    const rawToken = matchingCookies[0].slice("accessToken=".length);

    if (!rawToken) {
      throw new UnauthorizedException("Authentication required.");
    }

    try {
      const token = decodeURIComponent(rawToken);

      if (!token.trim()) {
        throw new UnauthorizedException("Authentication required.");
      }

      return token;
    } catch {
      throw new UnauthorizedException("Invalid authentication cookie.");
    }
  }
}
