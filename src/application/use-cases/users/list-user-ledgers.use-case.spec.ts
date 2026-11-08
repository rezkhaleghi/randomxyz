import { ListUserLedgersUseCase } from "./list-user-ledgers.use-case";
import { LedgerRepository } from "@domain/repositories/ledger.repository";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";

describe("ListUserLedgersUseCase", () => {
  const ledgerRepository = { searchUserLedgers: jest.fn() };
  let useCase: ListUserLedgersUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new ListUserLedgersUseCase(
      ledgerRepository as unknown as LedgerRepository,
    );
  });

  it("passes filters and pagination to the repository", async () => {
    const result = {
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    };
    ledgerRepository.searchUserLedgers.mockResolvedValue(result);

    const from = new Date("2026-11-01T00:00:00.000Z");
    const to = new Date("2026-11-30T23:59:59.999Z");

    await expect(
      useCase.execute({
        userId: "user-1",
        currency: PaymentCurrency.IRT,
        type: LedgerType.PERMIT_PAYMENT,
        referenceId: "permit-1",
        from,
        to,
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      }),
    ).resolves.toBe(result);

    expect(ledgerRepository.searchUserLedgers).toHaveBeenCalledWith(
      "user-1",
      {
        currency: PaymentCurrency.IRT,
        type: LedgerType.PERMIT_PAYMENT,
        referenceId: "permit-1",
        from,
        to,
      },
      {
        page: 1,
        limit: 20,
        sortBy: "createdAt",
        sortDirection: "DESC",
      },
    );
  });

  it("passes empty filters when none are supplied", async () => {
    ledgerRepository.searchUserLedgers.mockResolvedValue({
      data: [],
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    await useCase.execute({
      userId: "user-1",
      page: 1,
      limit: 20,
    });

    expect(ledgerRepository.searchUserLedgers).toHaveBeenCalledWith(
      "user-1",
      {
        currency: undefined,
        type: undefined,
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
