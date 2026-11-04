import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RevokePermitDto {
  @ApiProperty({
    description: "Reason for revoking the permit.",
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
