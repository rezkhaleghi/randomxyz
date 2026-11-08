import { AdminGetPermitUseCase } from "./get-permit.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { NotFoundException } from "@nestjs/common";

describe("AdminGetPermitUseCase", () => {
  const permitRepository = { findById: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: AdminGetPermitUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ permitRepository }),
    );
    useCase = new AdminGetPermitUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("returns the admin permit details", async () => {
    const permit = {
      id: "permit-1",
      userId: "user-1",
      locationId: "location-1",
      startDate: "2026-11-10",
      endDate: "2026-11-10",
      status: "CONFIRMED",
      totalAmount: "100",
      currency: "IRT",
      qrToken: "qr-token",
      passengers: [],
      vehicles: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      internalField: "not exposed",
    };
    permitRepository.findById.mockResolvedValue(permit);

    const result = await useCase.execute("permit-1");

    expect(result).toEqual({
      id: permit.id,
      userId: permit.userId,
      locationId: permit.locationId,
      startDate: permit.startDate,
      endDate: permit.endDate,
      status: permit.status,
      totalAmount: permit.totalAmount,
      currency: permit.currency,
      qrToken: permit.qrToken,
      passengers: permit.passengers,
      vehicles: permit.vehicles,
      createdAt: permit.createdAt,
      updatedAt: permit.updatedAt,
    });
    expect(result).not.toHaveProperty("internalField");
  });

  it("throws when the permit does not exist", async () => {
    permitRepository.findById.mockResolvedValue(null);

    await expect(useCase.execute("missing")).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
