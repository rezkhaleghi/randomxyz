import { AdminRevokePermitUseCase } from "./revoke-permit.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { PermitStatus } from "@domain/enums/permit-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

describe("AdminRevokePermitUseCase", () => {
  const permit = {
    id: "permit-1",
    userId: "user-1",
    locationId: "location-1",
    status: PermitStatus.CONFIRMED,
    totalAmount: "100",
    currency: PaymentCurrency.IRT,
    revoke: jest.fn(function (this: any) {
      this.status = PermitStatus.REVOKED;
    }),
  };

  const permitRepository = {
    findById: jest.fn(),
    findByIdForUpdate: jest.fn(),
    save: jest.fn(),
  };
  const locationRepository = { findByIdForUpdate: jest.fn() };
  const balanceRepository = {
    findByUserIdAndCurrencyForUpdate: jest.fn(),
    save: jest.fn(),
  };
  const ledgerRepository = { create: jest.fn() };
  const auditLogRepository = { create: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: AdminRevokePermitUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    permit.status = PermitStatus.CONFIRMED;
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({
        permitRepository,
        locationRepository,
        userBalanceRepository: balanceRepository,
        ledgerRepository,
        auditLogRepository,
      }),
    );
    permitRepository.findById.mockResolvedValue(permit);
    permitRepository.findByIdForUpdate.mockResolvedValue(permit);
    locationRepository.findByIdForUpdate.mockResolvedValue({
      id: "location-1",
    });
    permitRepository.save.mockResolvedValue(permit);
    useCase = new AdminRevokePermitUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("requires a reason", async () => {
    await expect(
      useCase.execute({
        permitId: "permit-1",
        actorUserId: "admin-1",
        reason: " ",
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it("revokes a confirmed permit without issuing a refund by default", async () => {
    const result = await useCase.execute({
      permitId: "permit-1",
      actorUserId: "admin-1",
      reason: "Duplicate booking",
    });

    expect(permit.revoke).toHaveBeenCalled();
    expect(permitRepository.save).toHaveBeenCalledWith(permit);
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      id: "permit-1",
      status: PermitStatus.REVOKED,
      refundIssued: false,
      refundAmount: "0",
      currency: PaymentCurrency.IRT,
    });
    expect(
      balanceRepository.findByUserIdAndCurrencyForUpdate,
    ).not.toHaveBeenCalled();
  });

  it("credits the user's balance and creates a refund ledger when requested", async () => {
    const balance = {
      amount: "50",
      credit: jest.fn(function (this: any, amount: string) {
        this.amount = String(Number(this.amount) + Number(amount));
      }),
    };
    balanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(
      balance,
    );
    balanceRepository.save.mockImplementation(async (value) => value);

    const result = await useCase.execute({
      permitId: "permit-1",
      actorUserId: "admin-1",
      reason: "Approved refund",
      refund: true,
    });

    expect(balance.credit).toHaveBeenCalledWith("100");
    expect(balanceRepository.save).toHaveBeenCalledWith(balance);
    expect(ledgerRepository.create).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      refundIssued: true,
      refundAmount: "100",
    });
  });

  it("throws when the permit does not exist", async () => {
    permitRepository.findById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        permitId: "missing",
        actorUserId: "admin-1",
        reason: "Reason",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("throws when the location does not exist", async () => {
    locationRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        permitId: "permit-1",
        actorUserId: "admin-1",
        reason: "Reason",
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("rejects permits that cannot be revoked", async () => {
    permit.status = PermitStatus.ENDED;

    await expect(
      useCase.execute({
        permitId: "permit-1",
        actorUserId: "admin-1",
        reason: "Reason",
      }),
    ).rejects.toBeInstanceOf(ConflictException);

    expect(permitRepository.save).not.toHaveBeenCalled();
  });

  it("throws when a refund is requested but the balance is missing", async () => {
    balanceRepository.findByUserIdAndCurrencyForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute({
        permitId: "permit-1",
        actorUserId: "admin-1",
        reason: "Reason",
        refund: true,
      }),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
