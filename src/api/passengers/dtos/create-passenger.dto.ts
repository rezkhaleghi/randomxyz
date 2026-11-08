import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class CreatePassengerDto {
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
}
