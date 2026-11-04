import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

import { PaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListLocationsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    description: "Search by location name, slug, city, or province.",
    example: "Mazandaran",
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
