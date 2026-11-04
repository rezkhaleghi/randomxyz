import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from "class-validator";

export class UpdatePermitPassengerDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  nationalId!: string;

  @ApiProperty()
  @IsBoolean()
  isLeader!: boolean;
}

export class UpdatePermitVehicleDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  kind!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  color!: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  plateId!: string;
}

export class UpdatePermitDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason!: string;

  @ApiProperty({ type: [UpdatePermitPassengerDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdatePermitPassengerDto)
  passengers!: UpdatePermitPassengerDto[];

  @ApiProperty({ type: [UpdatePermitVehicleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => UpdatePermitVehicleDto)
  vehicles!: UpdatePermitVehicleDto[];
}
