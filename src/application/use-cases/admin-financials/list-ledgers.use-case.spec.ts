import { describe, expect, it, jest } from "@jest/globals";

import { ListLedgersUseCase } from "./list-ledgers.use-case";
import { LedgerRepository } from "@domain/repositories/ledger.repository";

describe("ListLedgersUseCase", () => {
  it("lists admin ledgers", async () => {
    const repository = {
      searchAdminLedgers: jest.fn<() => Promise<any>>(),
    };

    const page = {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };

    repository.searchAdminLedgers.mockResolvedValue(page);

    const result = await new ListLedgersUseCase(
      repository as unknown as LedgerRepository,
    ).execute({
      page: 1,
      limit: 20,
    });

    expect(result).toBe(page);
    expect(repository.searchAdminLedgers).toHaveBeenCalledWith(
      {
        userId: undefined,
        currency: undefined,
        type: undefined,
        actorUserId: undefined,
        referenceId: undefined,
        from: undefined,
        to: undefined,
      },
      {
        page: 1,
        limit: 20,
        sortBy: undefined,
        sortDirection: undefined,
      },
    );
  });
});
