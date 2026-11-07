export interface AdminStatistics {
  totalUsers: number;
  totalAdmins: number;
  verifiedUsers: number;
  unverifiedUsers: number;
  totalPermits: number;
  totalDeposits: number;
  totalOngoingPermits: number;
}

export abstract class AdminStatisticsService {
  abstract getStatistics(): Promise<AdminStatistics>;
}
