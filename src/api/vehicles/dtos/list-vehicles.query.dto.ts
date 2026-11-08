import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListVehiclesQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    description: "Search by vehicle kind, color, or plate ID.",
  })
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
