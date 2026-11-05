import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { DepositStatus } from "@domain/enums/deposit-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export class ListDepositsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: DepositStatus,
    description: "Filter by deposit status.",
  })
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @ApiPropertyOptional({
    enum: PaymentCurrency,
    description: "Filter by currency.",
  })
  @IsOptional()
  @IsEnum(PaymentCurrency)
  currency?: PaymentCurrency;

  @ApiPropertyOptional({
    description: "Filter by reference ID.",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID()
  referenceId?: string;

  @ApiPropertyOptional({
    description: "Filter by provider payment ID.",
  })
  @IsOptional()
  @IsString()
  providerPaymentId?: string;

  @ApiPropertyOptional({
    description: "Return deposits created from this date.",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Return deposits created until this date.",
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    enum: ["createdAt", "amount"],
    default: "createdAt",
  })
  @IsOptional()
  @IsEnum(["createdAt", "amount"])
  sortBy: "createdAt" | "amount" = "createdAt";
}
