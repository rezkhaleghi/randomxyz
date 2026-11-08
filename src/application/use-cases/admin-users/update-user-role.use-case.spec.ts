import { UpdateUserRoleUseCase } from "./update-user-role.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { User } from "@domain/entities/user.entity";
import { UserRole } from "@domain/enums/user-role.enum";
import {
  CannotRemoveLastAdminException,
  UserNotFoundException,
} from "@domain/exceptions/domain.exception";

describe("UpdateUserRoleUseCase", () => {
  const userRepository = {
    findByIdForUpdate: jest.fn(),
    countEffectiveAdmins: jest.fn(),
    save: jest.fn(),
  };
  const auditLogRepository = { create: jest.fn() };
  const unitOfWork = { execute: jest.fn() };
  let useCase: UpdateUserRoleUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ userRepository, auditLogRepository }),
    );
    useCase = new UpdateUserRoleUseCase(unitOfWork as unknown as UnitOfWork);
  });

  const createAdmin = (tmarTravelRole = "user") =>
    User.create({
      id: "user-1",
      email: "admin@example.com",
      role: UserRole.ADMIN,
      tmarTravelRole,
    });

  it("throws when the user does not exist", async () => {
    userRepository.findByIdForUpdate.mockResolvedValue(null);

    await expect(
      useCase.execute("missing", UserRole.USER, "admin-1"),
    ).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it("returns without saving or auditing when the role is unchanged", async () => {
    const user = createAdmin();
    userRepository.findByIdForUpdate.mockResolvedValue(user);

    await expect(
      useCase.execute(user.id, UserRole.ADMIN, "admin-1"),
    ).resolves.toBe(user);

    expect(userRepository.save).not.toHaveBeenCalled();
    expect(auditLogRepository.create).not.toHaveBeenCalled();
  });

  it("prevents removing the last effective admin", async () => {
    const user = createAdmin();
    userRepository.findByIdForUpdate.mockResolvedValue(user);
    userRepository.countEffectiveAdmins.mockResolvedValue(1);

    await expect(
      useCase.execute(user.id, UserRole.USER, "admin-1"),
    ).rejects.toBeInstanceOf(CannotRemoveLastAdminException);

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("allows demoting a local admin when another effective admin exists", async () => {
    const user = createAdmin();
    userRepository.findByIdForUpdate.mockResolvedValue(user);
    userRepository.countEffectiveAdmins.mockResolvedValue(2);
    userRepository.save.mockImplementation(async (value) => value);

    const result = await useCase.execute(user.id, UserRole.USER, "admin-1");

    expect(result.role).toBe(UserRole.USER);
    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
  });

  it("allows demoting the last local admin if the external role remains admin", async () => {
    const user = createAdmin("admin");
    userRepository.findByIdForUpdate.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (value) => value);

    const result = await useCase.execute(user.id, UserRole.USER, "admin-1");

    expect(result.role).toBe(UserRole.USER);
    expect(userRepository.countEffectiveAdmins).not.toHaveBeenCalled();
    expect(auditLogRepository.create).toHaveBeenCalledTimes(1);
  });
});
