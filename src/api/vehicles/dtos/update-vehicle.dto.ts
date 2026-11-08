import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: "Land Rover Defender" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  kind?: string;

  @ApiPropertyOptional({ example: "Green" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  color?: string;

  @ApiPropertyOptional({ example: "12A345-IR" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  plateId?: string;
}
