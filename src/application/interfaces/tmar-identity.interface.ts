import { UserRole } from "@domain/enums/user-role.enum";

export interface TmarIdentity {
  _id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  status: string | null;
  role: UserRole;
}
