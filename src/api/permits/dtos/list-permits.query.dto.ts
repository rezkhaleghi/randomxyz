import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { PermitStatus } from "@domain/enums/permit-status.enum";

export class ListPermitsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: PermitStatus,
    isArray: true,
    description:
      "Filter by one or more permit statuses. Repeat the status query parameter to provide multiple values.",
    example: [PermitStatus.CONFIRMED, PermitStatus.EXPIRED],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === "") {
      return undefined;
    }

    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(PermitStatus, { each: true })
  status?: PermitStatus[];

  @ApiPropertyOptional({
    enum: ["createdAt", "startDate", "endDate"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "startDate", "endDate"])
  sortBy: "createdAt" | "startDate" | "endDate" = "createdAt";
}
