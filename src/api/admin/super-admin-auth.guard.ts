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

type AuthenticatedRequest = Request & {
  user?: User;
};

@Injectable()
export class SuperAdminAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("Super administrator access required.");
    }

    return true;
  }
}
