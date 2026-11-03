import type { Request } from "express";

import type { User } from "@domain/entities/user.entity";

export type AuthenticatedRequest = Request & {
  user: User;
};
