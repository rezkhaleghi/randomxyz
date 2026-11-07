import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";

import {
  AdminStatistics,
  AdminStatisticsService,
} from "@application/interfaces/admin-statistics.interface";

import { UserRole } from "@domain/enums/user-role.enum";
import { PermitStatus } from "@domain/enums/permit-status.enum";

import { UserOrmEntity } from "../database/orm-entities/user.orm-entity";
import { PermitOrmEntity } from "../database/orm-entities/permit.orm-entity";
import { DepositOrmEntity } from "../database/orm-entities/deposit.orm-entity";

@Injectable()
export class AdminStatisticsServiceImpl extends AdminStatisticsService {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,

    @InjectRepository(PermitOrmEntity)
    private readonly permitRepository: Repository<PermitOrmEntity>,

    @InjectRepository(DepositOrmEntity)
    private readonly depositRepository: Repository<DepositOrmEntity>,
  ) {
    super();
  }

  async getStatistics(): Promise<AdminStatistics> {
    const [
      totalUsers,
      totalAdmins,
      verifiedUsers,
      totalPermits,
      totalDeposits,
      totalOngoingPermits,
    ] = await Promise.all([
      this.userRepository.count(),

      this.userRepository.count({
        where: {
          role: UserRole.ADMIN,
        },
      }),

      this.userRepository.count({
        where: {
          emailVerified: true,
        },
      }),

      this.permitRepository.count(),

      this.depositRepository.count(),

      this.permitRepository.count({
        where: {
          status: In([PermitStatus.CONFIRMED, PermitStatus.EXPIRED]),
        },
      }),
    ]);

    return {
      totalUsers,
      totalAdmins,
      verifiedUsers,
      unverifiedUsers: totalUsers - verifiedUsers,
      totalPermits,
      totalDeposits,
      totalOngoingPermits,
    };
  }
}
