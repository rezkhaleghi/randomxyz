import { ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsInt,
  IsString,
  Matches,
  Max,
  Min,
  ValidateIf,
} from "class-validator";

export class UpsertLocationDateOverrideDto {
  @ApiPropertyOptional({
    description:
      "Daily capacity measured in people. Use null to inherit normal location capacity.",
    example: 300,
    nullable: true,
    minimum: 1,
    maximum: 1000000,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @Transform(({ value }) => (value === null ? null : Number(value)))
  @IsInt()
  @Min(1)
  @Max(1000000)
  capacity?: number | null;

  @ApiPropertyOptional({
    description:
      "Fee per vehicle in IRT. Use null to inherit the normal location fee.",
    example: "3000000",
    nullable: true,
  })
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsString()
  @Matches(/^(0|[1-9]\d*)$/)
  fee?: string | null;
}
