import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class AdminListPassengersQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({ format: "uuid" })
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ["createdAt", "fullName"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "fullName"])
  sortBy: "createdAt" | "fullName" = "createdAt";
}
