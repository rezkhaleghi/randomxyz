import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreatePermitPassengerDto {
  @ApiProperty({ example: "Reza Khaleghi" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName!: string;

  @ApiProperty({ example: "1234567890" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  nationalId!: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  isLeader!: boolean;
}

export class CreatePermitVehicleDto {
  @ApiProperty({ example: "Land Rover Defender" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  kind!: string;

  @ApiProperty({ example: "Green" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  color!: string;

  @ApiProperty({ example: "12A345-IR" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  plateId!: string;
}

export class CreatePermitDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  locationId!: string;

  @ApiProperty({
    example: "2026-11-10",
    description: "Start date in Asia/Tehran local date format.",
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  startDate!: string;

  @ApiProperty({
    example: "2026-11-12",
    description: "End date in Asia/Tehran local date format, inclusive.",
  })
  @IsDateString({ strict: true })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  endDate!: string;

  @ApiProperty({ type: [CreatePermitPassengerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePermitPassengerDto)
  passengers!: CreatePermitPassengerDto[];

  @ApiProperty({ type: [CreatePermitVehicleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePermitVehicleDto)
  vehicles!: CreatePermitVehicleDto[];
}
