import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";

import { SortablePaginationQueryDto } from "@shared/pagination/pagination.query.dto";
import { WithdrawalStatus } from "@domain/enums/withdrawal-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export class ListWithdrawalsQueryDto extends SortablePaginationQueryDto {
  @ApiPropertyOptional({
    enum: WithdrawalStatus,
    description: "Filter by withdrawal status.",
  })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

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
    description: "Return withdrawals created from this date.",
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description: "Return withdrawals created until this date.",
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
