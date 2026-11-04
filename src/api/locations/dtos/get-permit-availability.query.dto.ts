import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, IsInt, Matches, Min } from "class-validator";

export class GetPermitAvailabilityQueryDto {
  @ApiProperty({
    description: "First date to include, in Asia/Tehran local date format.",
    example: "2026-11-01",
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @ApiProperty({
    description: "Last date to include, in Asia/Tehran local date format.",
    example: "2026-11-30",
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @ApiProperty({
    description: "Number of vehicles in the permit.",
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicleCount!: number;

  @ApiProperty({
    description: "Total number of passengers in the permit.",
    example: 5,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  passengerCount!: number;
}
