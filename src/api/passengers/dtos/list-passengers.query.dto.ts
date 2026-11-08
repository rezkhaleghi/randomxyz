import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";

export class ListPassengersQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    description: "Search by passenger name or national ID.",
  })
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
