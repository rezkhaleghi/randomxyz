import { TmarAuthUseCase } from "./tmar-auth.use-case";
import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";
import { User } from "@domain/entities/user.entity";
import { UserBalance } from "@domain/entities/user-balance.entity";
import { UserStatus } from "@domain/enums/user-status.enum";
import { PaymentCurrency } from "@domain/enums/payment-currency.enum";
import { ApplicationUnauthorizedException } from "@application/exceptions/application-unauthorized.exception";

describe("TmarAuthUseCase", () => {
  const userRepository = {
    findByExternalUserId: jest.fn(),
    createIfNotExistsByExternalUserId: jest.fn(),
    findByIdForUpdate: jest.fn(),
    save: jest.fn(),
  };
  const userBalanceRepository = {
    findByUserIdAndCurrency: jest.fn(),
    create: jest.fn(),
  };
  const unitOfWork = { execute: jest.fn() };
  let useCase: TmarAuthUseCase;

  const identity = {
    _id: "external-1",
    email: " USER@EXAMPLE.COM ",
    firstName: "Reza",
    lastName: "Khaleghi",
    role: "user",
    status: "active",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    unitOfWork.execute.mockImplementation((callback: any) =>
      callback({ userRepository, userBalanceRepository }),
    );
    userBalanceRepository.findByUserIdAndCurrency.mockResolvedValue({
      id: "balance-1",
    });
    useCase = new TmarAuthUseCase(unitOfWork as unknown as UnitOfWork);
  });

  it("rejects an empty external ID or email", async () => {
    await expect(
      useCase.execute({ ...identity, _id: " " }),
    ).rejects.toBeInstanceOf(ApplicationUnauthorizedException);

    await expect(
      useCase.execute({ ...identity, email: " " }),
    ).rejects.toBeInstanceOf(ApplicationUnauthorizedException);

    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it("rejects a blocked Tmar-Travel account", async () => {
    await expect(
      useCase.execute({ ...identity, status: "blocked" }),
    ).rejects.toBeInstanceOf(ApplicationUnauthorizedException);

    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  it("creates a local user and initial balance for a new external identity", async () => {
    const user = User.create({
      id: "user-1",
      externalUserId: "external-1",
      email: "user@example.com",
      emailVerified: true,
    });

    userRepository.findByExternalUserId.mockResolvedValue(null);
    userRepository.createIfNotExistsByExternalUserId.mockResolvedValue(user);
    userRepository.findByIdForUpdate.mockResolvedValue(user);
    userBalanceRepository.findByUserIdAndCurrency.mockResolvedValue(null);
    userBalanceRepository.create.mockImplementation(async (balance) => balance);

    await expect(useCase.execute(identity)).resolves.toBe(user);

    expect(userRepository.findByExternalUserId).toHaveBeenCalledWith(
      "external-1",
    );
    expect(
      userRepository.createIfNotExistsByExternalUserId,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        externalUserId: "external-1",
        email: "user@example.com",
      }),
    );
    expect(userBalanceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-1",
        currency: PaymentCurrency.IRT,
      }),
    );
  });

  it("rejects a restricted local account", async () => {
    const user = User.create({
      id: "user-1",
      externalUserId: "external-1",
      email: "user@example.com",
    });
    user.restrict();

    userRepository.findByExternalUserId.mockResolvedValue(user);
    userRepository.findByIdForUpdate.mockResolvedValue(user);

    await expect(useCase.execute(identity)).rejects.toBeInstanceOf(
      ApplicationUnauthorizedException,
    );

    expect(userRepository.save).not.toHaveBeenCalled();
  });

  it("synchronizes changed external profile details", async () => {
    const user = User.create({
      id: "user-1",
      externalUserId: "external-1",
      email: "old@example.com",
      emailVerified: false,
    });

    userRepository.findByExternalUserId.mockResolvedValue(user);
    userRepository.findByIdForUpdate.mockResolvedValue(user);
    userRepository.save.mockImplementation(async (value) => value);

    await useCase.execute(identity);

    expect(userRepository.save).toHaveBeenCalledWith(user);
    expect(user.email).toBe("user@example.com");
    expect(user.firstName).toBe("Reza");
    expect(user.lastName).toBe("Khaleghi");
    expect(user.emailVerified).toBe(true);
  });

  it("does not save an unchanged profile", async () => {
    const user = User.create({
      id: "user-1",
      externalUserId: "external-1",
      email: "user@example.com",
      emailVerified: true,
    });
    user.synchronizeTmarTravelProfile({
      externalUserId: "external-1",
      email: "user@example.com",
      firstName: "Reza",
      lastName: "Khaleghi",
      role: "user",
    });

    userRepository.findByExternalUserId.mockResolvedValue(user);
    userRepository.findByIdForUpdate.mockResolvedValue(user);

    await useCase.execute(identity);

    expect(userRepository.save).not.toHaveBeenCalled();
  });
});
