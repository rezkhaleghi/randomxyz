import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from "class-validator";

export class CreateLocationDateOverrideDto {
  @ApiProperty({
    description: "Calendar date in YYYY-MM-DD format.",
    example: "2026-12-21",
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date!: string;

  @ApiPropertyOptional({
    description: "Daily capacity measured in people.",
    example: 300,
    minimum: 1,
    maximum: 1000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacity?: number;

  @ApiPropertyOptional({
    description: "Fee per vehicle in IRT. Omit to inherit the location fee.",
    example: "3000000",
  })
  @IsOptional()
  @IsString()
  @Matches(/^(0|[1-9]\d*)$/)
  fee?: string;
}
