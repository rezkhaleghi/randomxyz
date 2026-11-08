import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { CreatePassengerDto } from "./create-passenger.dto";

export class UpdatePassengerDto extends CreatePassengerDto {
  @ApiPropertyOptional({ example: "Reza Khaleghi" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({ example: "1234567890" })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  nationalId?: string;
}
