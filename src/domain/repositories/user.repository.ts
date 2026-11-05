import { User } from "../entities/user.entity";
import { AdminUserSearchFilters } from "./admin-user-search-filters";
import { PageQuery, PageResult } from "@shared/pagination/page-query";
import { UserRole } from "@domain/enums/user-role.enum";

export abstract class UserRepository {
  abstract findById(id: string): Promise<User | null>;

  abstract findByIdForUpdate(id: string): Promise<User | null>;

  abstract findByEmail(email: string): Promise<User | null>;

  abstract findByExternalUserId(externalUserId: string): Promise<User | null>;

  abstract findByUserName(userName: string): Promise<User | null>;

  abstract createIfNotExistsByExternalUserId(user: User): Promise<User>;

  abstract findPage(
    params: PageQuery<"createdAt" | "email" | "role">,
  ): Promise<PageResult<User>>;

  abstract searchAdminUsers(
    filters: AdminUserSearchFilters,
    params: PageQuery<"createdAt" | "email" | "role">,
  ): Promise<PageResult<User>>;

  abstract countByRole(role: UserRole): Promise<number>;

  abstract countEffectiveAdmins(): Promise<number>;

  abstract save(user: User): Promise<User>;

  abstract saveAdminMutation(
    user: User,
    wasAdmin: boolean,
  ): Promise<User | null>;

  abstract deleteAdminUser(id: string): Promise<boolean>;

  abstract deleteById(id: string): Promise<void>;
}
