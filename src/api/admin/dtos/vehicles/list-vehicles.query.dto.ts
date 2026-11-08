import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class AdminListVehiclesQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ["createdAt", "kind", "plateId"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "kind", "plateId"])
  sortBy: "createdAt" | "kind" | "plateId" = "createdAt";
}
