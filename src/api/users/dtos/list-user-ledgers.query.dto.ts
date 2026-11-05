import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export class ListUserLedgersQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: LedgerType,
    description: "Filter by ledger entry type.",
  })
  @IsOptional()
  @IsEnum(LedgerType)
  type?: LedgerType;

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
    description: "Return entries created from this date.",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Return entries created until this date.",
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
