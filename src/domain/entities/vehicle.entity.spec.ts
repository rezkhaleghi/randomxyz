import { Vehicle } from "./vehicle.entity";

describe("Vehicle", () => {
  it("creates a vehicle with a generated ID and trimmed details", () => {
    const vehicle = Vehicle.create({
      userId: "user-1",
      kind: " Land Rover Defender ",
      color: " Green ",
      plateId: " 12A345-IR ",
    });

    expect(vehicle.id).toBeDefined();
    expect(vehicle.userId).toBe("user-1");
    expect(vehicle.kind).toBe("Land Rover Defender");
    expect(vehicle.color).toBe("Green");
    expect(vehicle.plateId).toBe("12A345-IR");
    expect(vehicle.createdAt).toBeInstanceOf(Date);
    expect(vehicle.updatedAt).toBe(vehicle.createdAt);
  });

  it("preserves a supplied ID", () => {
    const vehicle = Vehicle.create({
      id: "vehicle-1",
      userId: "user-1",
      kind: "Defender",
      color: "Green",
      plateId: "123",
    });

    expect(vehicle.id).toBe("vehicle-1");
  });

  it("restores a vehicle without changing persisted values", () => {
    const createdAt = new Date("2026-01-01T00:00:00.000Z");
    const updatedAt = new Date("2026-02-01T00:00:00.000Z");

    const vehicle = Vehicle.restore({
      id: "vehicle-1",
      userId: "user-1",
      kind: "Land Rover Defender",
      color: "Green",
      plateId: "12A345-IR",
      createdAt,
      updatedAt,
    });

    expect(vehicle.id).toBe("vehicle-1");
    expect(vehicle.kind).toBe("Land Rover Defender");
    expect(vehicle.color).toBe("Green");
    expect(vehicle.plateId).toBe("12A345-IR");
    expect(vehicle.createdAt).toBe(createdAt);
    expect(vehicle.updatedAt).toBe(updatedAt);
  });

  it("updates and trims vehicle details", () => {
    const vehicle = Vehicle.create({
      userId: "user-1",
      kind: "Old",
      color: "Red",
      plateId: "111",
    });
    const previousUpdatedAt = vehicle.updatedAt;

    vehicle.update({
      kind: " Land Rover Defender ",
      color: " Green ",
      plateId: " 12A345-IR ",
    });

    expect(vehicle.kind).toBe("Land Rover Defender");
    expect(vehicle.color).toBe("Green");
    expect(vehicle.plateId).toBe("12A345-IR");
    expect(vehicle.updatedAt.getTime()).toBeGreaterThanOrEqual(
      previousUpdatedAt.getTime(),
    );
  });
});
