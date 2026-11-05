import { User } from "./user.entity";
import { UserRole } from "../enums/user-role.enum";
import { UserStatus } from "../enums/user-status.enum";

describe("User", () => {
  const createUser = () =>
    User.create({
      email: "user@example.com",
    });

  it("creates a regular active user with default values", () => {
    const user = createUser();

    expect(user.id).toBeDefined();
    expect(user.email).toBe("user@example.com");
    expect(user.role).toBe(UserRole.USER);
    expect(user.tmarTravelRole).toBe(UserRole.USER);
    expect(user.emailVerified).toBe(false);
    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("preserves provided creation values", () => {
    const user = User.create({
      id: "user-1",
      externalUserId: "external-1",
      email: "admin@example.com",
      role: UserRole.ADMIN,
      tmarTravelRole: "admin",
      emailVerified: true,
    });

    expect(user.id).toBe("user-1");
    expect(user.externalUserId).toBe("external-1");
    expect(user.email).toBe("admin@example.com");
    expect(user.role).toBe(UserRole.ADMIN);
    expect(user.tmarTravelRole).toBe("admin");
    expect(user.emailVerified).toBe(true);
  });

  it("updates provided profile fields", () => {
    const user = createUser();
    const dateOfBirth = new Date("2000-01-01");

    user.update({
      firstName: "Reza",
      lastName: "Khaleghi",
      userName: "reza",
      dateOfBirth,
      bio: "Software Engineer",
    });

    expect(user.firstName).toBe("Reza");
    expect(user.lastName).toBe("Khaleghi");
    expect(user.userName).toBe("reza");
    expect(user.dateOfBirth).toBe(dateOfBirth);
    expect(user.bio).toBe("Software Engineer");
  });

  it("clears profile fields when explicitly set to null", () => {
    const user = User.restore({
      id: "user-1",
      externalUserId: "external-1",
      email: "user@example.com",
      role: UserRole.USER,
      tmarTravelRole: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: "Reza",
      lastName: "Khaleghi",
      userName: "reza",
      dateOfBirth: new Date("2000-01-01"),
      bio: "Bio",
      status: UserStatus.ACTIVE,
    });

    user.update({
      firstName: null,
      lastName: null,
      userName: null,
      dateOfBirth: null,
      bio: null,
    });

    expect(user.firstName).toBeNull();
    expect(user.lastName).toBeNull();
    expect(user.userName).toBeNull();
    expect(user.dateOfBirth).toBeNull();
    expect(user.bio).toBeNull();
  });

  it("does not change profile fields that are undefined", () => {
    const user = User.restore({
      id: "user-1",
      email: "user@example.com",
      role: UserRole.USER,
      tmarTravelRole: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: "Reza",
      lastName: "Khaleghi",
      userName: "reza",
      dateOfBirth: null,
      bio: "Bio",
      status: UserStatus.ACTIVE,
    });

    user.update({
      firstName: undefined,
      userName: undefined,
    });

    expect(user.firstName).toBe("Reza");
    expect(user.userName).toBe("reza");
    expect(user.lastName).toBe("Khaleghi");
    expect(user.bio).toBe("Bio");
  });

  it("synchronizes the profile from TmarTravel", () => {
    const user = createUser();

    user.synchronizeTmarTravelProfile({
      externalUserId: "external-1",
      email: "user@example.com",
      firstName: "Reza",
      lastName: "Khaleghi",
      role: "admin",
    });

    expect(user.externalUserId).toBe("external-1");
    expect(user.email).toBe("user@example.com");
    expect(user.firstName).toBe("Reza");
    expect(user.lastName).toBe("Khaleghi");
    expect(user.tmarTravelRole).toBe("admin");
    expect(user.emailVerified).toBe(true);
  });

  it("does not allow changing an existing external identity", () => {
    const user = User.create({
      email: "user@example.com",
      externalUserId: "external-1",
    });

    expect(() =>
      user.synchronizeTmarTravelProfile({
        externalUserId: "external-2",
        email: "user@example.com",
        firstName: null,
        lastName: null,
        role: "user",
      }),
    ).toThrow("External user identity cannot be changed.");
  });

  it("changes the email", () => {
    const user = createUser();

    user.changeEmail("new@example.com");

    expect(user.email).toBe("new@example.com");
  });

  it("changes the local role", () => {
    const user = createUser();

    user.changeRole(UserRole.ADMIN);

    expect(user.role).toBe(UserRole.ADMIN);
  });

  it("activates a restricted user", () => {
    const user = User.restore({
      id: "user-1",
      email: "user@example.com",
      role: UserRole.USER,
      tmarTravelRole: UserRole.USER,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      firstName: null,
      lastName: null,
      userName: null,
      dateOfBirth: null,
      bio: null,
      status: UserStatus.RESTRICTED,
    });

    user.activate();

    expect(user.status).toBe(UserStatus.ACTIVE);
  });

  it("restricts an active user", () => {
    const user = createUser();

    user.restrict();

    expect(user.status).toBe(UserStatus.RESTRICTED);
  });
});
