import { randomUUID } from "crypto";

import { UserStatus } from "@domain/enums/user-status.enum";
import { UserRole } from "../enums/user-role.enum";

export type UpdateUserParams = Partial<{
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  dateOfBirth: Date | null;
  bio: string | null;
}>;

export interface CreateUserProps {
  id?: string;
  externalUserId?: string | null;
  email: string;
  role?: UserRole;
  tmarTravelRole?: string;
  emailVerified?: boolean;
}

export interface RestoreUserProps {
  id: string;
  externalUserId?: string | null;
  email: string;
  role: UserRole;
  tmarTravelRole?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  firstName: string | null;
  lastName: string | null;
  userName: string | null;
  dateOfBirth: Date | null;
  bio: string | null;
  status: UserStatus;
}

export class User {
  private _emailVerified: boolean;
  private _updatedAt: Date;

  private constructor(
    public readonly id: string,
    public externalUserId: string | null,
    public email: string,
    public role: UserRole,
    public tmarTravelRole: string,
    emailVerified: boolean,
    public readonly createdAt: Date,
    updatedAt: Date,
    public firstName: string | null,
    public lastName: string | null,
    public userName: string | null,
    public dateOfBirth: Date | null,
    public bio: string | null,
    public status: UserStatus,
  ) {
    this._emailVerified = emailVerified;
    this._updatedAt = updatedAt;
  }

  get emailVerified(): boolean {
    return this._emailVerified;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  private touch(): void {
    this._updatedAt = new Date();
  }

  static create(params: CreateUserProps): User {
    const now = new Date();

    return new User(
      params.id ?? randomUUID(),
      params.externalUserId ?? null,
      params.email,
      params.role ?? UserRole.USER,
      params.tmarTravelRole ?? UserRole.USER,
      params.emailVerified ?? false,
      now,
      now,
      null,
      null,
      null,
      null,
      null,
      UserStatus.ACTIVE,
    );
  }

  static restore(params: RestoreUserProps): User {
    return new User(
      params.id,
      params.externalUserId ?? null,
      params.email,
      params.role,
      params.tmarTravelRole ?? UserRole.USER,
      params.emailVerified,
      params.createdAt,
      params.updatedAt,
      params.firstName,
      params.lastName,
      params.userName,
      params.dateOfBirth,
      params.bio,
      params.status,
    );
  }

  update(params: UpdateUserParams): void {
    if (params.firstName !== undefined) {
      this.firstName = params.firstName;
    }

    if (params.lastName !== undefined) {
      this.lastName = params.lastName;
    }

    if (params.userName !== undefined) {
      this.userName = params.userName;
    }

    if (params.dateOfBirth !== undefined) {
      this.dateOfBirth = params.dateOfBirth;
    }

    if (params.bio !== undefined) {
      this.bio = params.bio;
    }

    this.touch();
  }

  synchronizeTmarTravelProfile(params: {
    externalUserId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
  }): void {
    if (this.externalUserId && this.externalUserId !== params.externalUserId) {
      throw new Error("External user identity cannot be changed.");
    }

    this.externalUserId = params.externalUserId;
    this.email = params.email;
    this.firstName = params.firstName;
    this.lastName = params.lastName;
    this.tmarTravelRole = params.role;
    this._emailVerified = true;

    this.touch();
  }

  changeEmail(email: string): void {
    this.email = email;
    this.touch();
  }

  changeRole(role: UserRole): void {
    this.role = role;
    this.touch();
  }

  activate(): void {
    this.status = UserStatus.ACTIVE;
    this.touch();
  }

  restrict(): void {
    this.status = UserStatus.RESTRICTED;
    this.touch();
  }
}
