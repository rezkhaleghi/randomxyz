import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { TmarAuthGuard } from "./tmar-auth.guard";

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
  };
};

@Injectable()
export class AuthSessionGuard implements CanActivate {
  constructor(private readonly tmarAuthGuard: TmarAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.tmarAuthGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user || !request.session) {
      throw new UnauthorizedException();
    }

    // Temporary compatibility for controllers still using req.session.userId.
    request.session.userId = request.user.id;

    return true;
  }
}
