import { Passenger } from "./passenger.entity";

describe("Passenger", () => {
  it("creates a passenger with a generated ID and normalized details", () => {
    const passenger = Passenger.create({
      userId: "user-1",
      fullName: "  Reza Khaleghi  ",
      nationalId: " 1234567890 ",
    });

    expect(passenger.id).toBeDefined();
    expect(passenger.userId).toBe("user-1");
    expect(passenger.fullName).toBe("reza khaleghi");
    expect(passenger.nationalId).toBe("1234567890");
    expect(passenger.createdAt).toBeInstanceOf(Date);
    expect(passenger.updatedAt).toBe(passenger.createdAt);
  });

  it("preserves a supplied ID", () => {
    const passenger = Passenger.create({
      id: "passenger-1",
      userId: "user-1",
      fullName: "Reza",
      nationalId: "123",
    });

    expect(passenger.id).toBe("passenger-1");
  });

  it("restores a passenger without changing persisted values", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-02-01T00:00:00.000Z");

    const passenger = Passenger.restore({
      id: "passenger-1",
      userId: "user-1",
      fullName: "reza khaleghi",
      nationalId: "1234567890",
      createdAt,
      updatedAt,
    });

    expect(passenger.id).toBe("passenger-1");
    expect(passenger.fullName).toBe("reza khaleghi");
    expect(passenger.nationalId).toBe("1234567890");
    expect(passenger.createdAt).toBe(createdAt);
    expect(passenger.updatedAt).toBe(updatedAt);
  });

  it("updates and normalizes passenger details", () => {
    const passenger = Passenger.create({
      userId: "user-1",
      fullName: "Old Name",
      nationalId: "111",
    });
    const previousUpdatedAt = passenger.updatedAt;

    passenger.update({
      fullName: "  Reza Khaleghi  ",
      nationalId: " 222 ",
    });

    expect(passenger.fullName).toBe("reza khaleghi");
    expect(passenger.nationalId).toBe("222");
    expect(passenger.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime(),
    );
  });
});
