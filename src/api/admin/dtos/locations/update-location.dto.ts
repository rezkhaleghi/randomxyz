import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

export class UpdateLocationDto {
  @ApiPropertyOptional({
    description: "Whether this location is enabled for permit requests.",
    example: true,
  })
  @ValidateIf((_, value) => value !== undefined)
  @IsBoolean()
  isEnabled?: boolean;

  @ApiPropertyOptional({
    description: "Normal daily capacity measured in people.",
    example: 200,
    minimum: 1,
    maximum: 1000000,
  })
  @ValidateIf((_, value) => value !== undefined)
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacity?: number;

  @ApiPropertyOptional({
    description:
      "Location-specific fee per vehicle in IRT. Use null to inherit the global default fee.",
    example: "2000000",
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @Matches(/^(0|[1-9]\d*)$/)
  fee?: string | null;
}
