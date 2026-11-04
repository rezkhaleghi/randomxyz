import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class UpdatePermitSettingsDto {
  @ApiProperty({
    description: "Global default fee per vehicle per day in IRT.",
    example: "3000000",
  })
  @IsString()
  @Matches(/^(0|[1-9]\d*)$/)
  defaultFee!: string;
}
