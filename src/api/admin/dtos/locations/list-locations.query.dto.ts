import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsBoolean, IsEnum, IsOptional, IsString } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListLocationsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    description: "Search by location name, slug, city, or province.",
    example: "Mazandaran",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Filter by Tmar-Travel availability.",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    description: "Filter by Tmar-Cert enabled status.",
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === "true" || value === true) return true;
    if (value === "false" || value === false) return false;
    return value;
  })
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    enum: ["name", "province", "city", "createdAt"],
    default: "name",
  })
  @IsOptional()
  @IsEnum(["name", "province", "city", "createdAt"])
  sortBy: "name" | "province" | "city" | "createdAt" = "name";
}
