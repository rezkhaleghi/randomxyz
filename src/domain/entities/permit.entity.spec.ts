import { Permit } from "./permit.entity";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { PermitStatus } from "@domain/enums/permit-status.enum";

describe("Permit", () => {
  const createPermit = () =>
    Permit.create({
      id: "permit-1",
      userId: "user-1",
      locationId: "location-1",
      startDate: "2026-11-10",
      endDate: "2026-11-11",
      totalAmount: "200",
      currency: PaymentCurrency.IRT,
      qrToken: "qr-token",
      passengers: [
        {
          id: "passenger-1",
          fullName: "reza khaleghi",
          nationalId: "1234567890",
          isLeader: true,
        },
      ],
      vehicles: [
        {
          id: "vehicle-1",
          kind: "Land Rover Defender",
          color: "Green",
          plateId: "12A345-IR",
        },
      ],
    });

  it("creates a confirmed permit with the supplied information", () => {
    const permit = createPermit();

    expect(permit.id).toBe("permit-1");
    expect(permit.userId).toBe("user-1");
    expect(permit.locationId).toBe("location-1");
    expect(permit.status).toBe(PermitStatus.CONFIRMED);
    expect(permit.totalAmount).toBe("200");
    expect(permit.currency).toBe(PaymentCurrency.IRT);
    expect(permit.qrToken).toBe("qr-token");
    expect(permit.passengers).toHaveLength(1);
    expect(permit.vehicles).toHaveLength(1);
  });

  it("uses empty participant arrays when none are supplied", () => {
    const permit = Permit.create({
      userId: "user-1",
      locationId: "location-1",
      startDate: "2026-11-10",
      endDate: "2026-11-10",
      totalAmount: "0",
      currency: PaymentCurrency.IRT,
      qrToken: "qr-token",
    });

    expect(permit.passengers).toEqual([]);
    expect(permit.vehicles).toEqual([]);
  });

  it("restores a permit with its persisted status and timestamps", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-02-01T00:00:00.000Z");

    const permit = Permit.restore({
      id: "permit-1",
      userId: "user-1",
      locationId: "location-1",
      startDate: "2026-11-10",
      endDate: "2026-11-10",
      status: PermitStatus.EXPIRED,
      totalAmount: "100",
      currency: PaymentCurrency.IRT,
      qrToken: "qr-token",
      createdAt,
      updatedAt,
    });

    expect(permit.status).toBe(PermitStatus.EXPIRED);
    expect(permit.createdAt).toBe(createdAt);
    expect(permit.updatedAt).toBe(updatedAt);
    expect(permit.passengers).toEqual([]);
    expect(permit.vehicles).toEqual([]);
  });

  it("updates participant snapshots", () => {
    const permit = createPermit();
    const passengers = [
      {
        id: null,
        fullName: "another passenger",
        nationalId: "9876543210",
        isLeader: true,
      },
    ];
    const vehicles = [
      {
        id: null,
        kind: "Jeep",
        color: "Black",
        plateId: "NEW-PLATE",
      },
    ];

    permit.updateParticipants(passengers, vehicles);

    expect(permit.passengers).toEqual(passengers);
    expect(permit.vehicles).toEqual(vehicles);
  });

  it("updates the total amount", () => {
    const permit = createPermit();

    permit.updateTotalAmount("300");

    expect(permit.totalAmount).toBe("300");
  });

  it("ends a permit", () => {
    const permit = createPermit();

    permit.end();

    expect(permit.status).toBe(PermitStatus.ENDED);
  });

  it("revokes a permit", () => {
    const permit = createPermit();

    permit.revoke();

    expect(permit.status).toBe(PermitStatus.REVOKED);
  });

  it("expires a permit", () => {
    const permit = createPermit();

    permit.expire();

    expect(permit.status).toBe(PermitStatus.EXPIRED);
  });
});
