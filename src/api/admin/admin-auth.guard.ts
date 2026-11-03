import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request } from "express";

import { User } from "@domain/entities/user.entity";
import { UserRole } from "@domain/enums/user-role.enum";

import { TmarAuthGuard } from "../auth/tmar-auth.guard";

type AuthenticatedRequest = Request & {
  user?: User;
};

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly tmarAuthGuard: TmarAuthGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.tmarAuthGuard.canActivate(context);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Administrator access required.");
    }

    // Temporary bridge for admin controllers that still use sessions.
    if (request.session) {
      request.session.userId = user.id;
    }

    return true;
  }
}
