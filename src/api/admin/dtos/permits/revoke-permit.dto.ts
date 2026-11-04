import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RevokePermitDto {
  @ApiProperty({
    description: "Reason for revoking the permit.",
  })
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiPropertyOptional({
    description: "Whether the full permit amount should be refunded.",
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  refund?: boolean;
}
