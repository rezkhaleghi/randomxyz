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

    const hasAdminAccess =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;

    if (!hasAdminAccess) {
      throw new ForbiddenException("Administrator access required.");
    }

    return true;
  }
}
