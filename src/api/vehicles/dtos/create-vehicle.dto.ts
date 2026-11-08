import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreateVehicleDto {
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
