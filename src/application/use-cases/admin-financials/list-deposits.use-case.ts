import { Injectable } from "@nestjs/common";

import { Deposit } from "@domain/entities/deposit.entity";
import { DepositRepository } from "@domain/repositories/deposit.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

export interface ListDepositsInput extends PageQuery<"createdAt" | "amount"> {
  userId?: string;
  id?: string;
  currency?: string;
  status?: string;
  providerPaymentId?: string;
  transactionId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AdminListDepositsUseCase {
  constructor(private readonly depositRepository: DepositRepository) {}

  async execute(input: ListDepositsInput): Promise<PageResult<Deposit>> {
    return this.depositRepository.search(
      {
        userId: input.userId,
        id: input.id,
        currency: input.currency,
        status: input.status,
        providerPaymentId: input.providerPaymentId,
        transactionId: input.transactionId,
        from: input.from,
        to: input.to,
      },
      {
        page: input.page,
        limit: input.limit,
        sortBy: input.sortBy,
        sortDirection: input.sortDirection,
      },
    );
  }
}
