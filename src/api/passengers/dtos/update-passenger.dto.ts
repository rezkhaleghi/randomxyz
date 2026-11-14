import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdatePassengerDto {
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

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isForeignNational?: boolean;
}
