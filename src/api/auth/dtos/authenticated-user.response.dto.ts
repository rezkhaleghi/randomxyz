import { ApiProperty } from "@nestjs/swagger";

export class AuthenticatedUserResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ nullable: true, type: String })
  email!: string | null;

  @ApiProperty({
    example: "tmar-travel",
  })
  referrer!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty({ nullable: true })
  firstName!: string | null;

  @ApiProperty({ nullable: true })
  lastName!: string | null;

  @ApiProperty({ nullable: true })
  userName!: string | null;

  @ApiProperty({ nullable: true, type: String, format: "date" })
  dateOfBirth!: Date | null;
}
