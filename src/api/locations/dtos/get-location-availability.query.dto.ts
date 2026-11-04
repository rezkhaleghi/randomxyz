import { ApiProperty } from "@nestjs/swagger";
import { IsDateString, Matches } from "class-validator";

export class GetLocationAvailabilityQueryDto {
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
}
