import { ApiProperty } from "@nestjs/swagger";
import { IsEnum } from "class-validator";

import { UserRole } from "@domain/enums/user-role.enum";

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    example: UserRole.ADMIN,
  })
  @IsEnum(UserRole)
  role!: UserRole;
}
