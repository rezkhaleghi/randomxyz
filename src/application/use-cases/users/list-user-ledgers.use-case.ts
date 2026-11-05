import { Injectable } from "@nestjs/common";

import { Ledger } from "@domain/entities/ledger.entity";
import { LedgerRepository } from "@domain/repositories/ledger.repository";
import { UserLedgerSearchFilters } from "@domain/repositories/user-ledger-search-filters";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

export interface ListUserLedgersInput extends PageQuery<
  "createdAt" | "amount"
> {
  userId: string;
  currency?: PaymentCurrency;
  type?: LedgerType;
  referenceId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class ListUserLedgersUseCase {
  constructor(private readonly ledgerRepository: LedgerRepository) {}

  async execute(input: ListUserLedgersInput): Promise<PageResult<Ledger>> {
    const filters: UserLedgerSearchFilters = {
      currency: input.currency,
      type: input.type,
      referenceId: input.referenceId,
      from: input.from,
      to: input.to,
    };

    return this.ledgerRepository.searchUserLedgers(input.userId, filters, {
      page: input.page,
      limit: input.limit,
      sortBy: input.sortBy,
      sortDirection: input.sortDirection,
    });
  }
}
