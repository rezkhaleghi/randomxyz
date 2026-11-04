import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, Matches } from "class-validator";

export class ListLocationDateOverridesQueryDto {
  @ApiPropertyOptional({
    description: "Only include overrides on or after this date.",
    example: "2026-12-01",
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate?: string;

  @ApiPropertyOptional({
    description: "Only include overrides on or before this date.",
    example: "2026-12-31",
  })
  @IsOptional()
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate?: string;
}
