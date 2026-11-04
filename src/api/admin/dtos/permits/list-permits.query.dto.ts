import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsUUID, Matches } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { PermitStatus } from "@domain/enums/permit-status.enum";

export class ListPermitsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  locationId?: string;

  @ApiPropertyOptional({ enum: PermitStatus })
  @IsOptional()
  @IsEnum(PermitStatus)
  status?: PermitStatus;

  @ApiPropertyOptional({ example: "2026-11-01" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDateFrom?: string;

  @ApiPropertyOptional({ example: "2026-12-31" })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDateTo?: string;
}
