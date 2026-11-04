import { Injectable } from "@nestjs/common";

import { UserNotFoundException } from "@domain/exceptions/domain.exception";
import { UserBalanceRepository } from "@domain/repositories/user-balance.repository";
import { UserRepository } from "@domain/repositories/user.repository";
import { PageQuery, PageResult } from "@shared/pagination/page-query";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";

export interface UserBalanceResponse {
  id: string;
  userId: string;
  currency: PaymentCurrency;
  amount: string;
}

@Injectable()
export class GetUserBalancesUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly userBalanceRepository: UserBalanceRepository,
  ) {}

  async execute(
    userId: string,
    query: PageQuery<"currency" | "amount" | "createdAt">,
  ): Promise<PageResult<UserBalanceResponse>> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    const result = await this.userBalanceRepository.findByUserId(userId, query);

    return {
      ...result,
      data: result.data.map((balance) => ({
        id: balance.id,
        userId: balance.userId,
        currency: balance.currency,
        amount: balance.amount,
      })),
    };
  }
}
