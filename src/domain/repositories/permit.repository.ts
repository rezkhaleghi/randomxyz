import { Permit } from "@domain/entities/permit.entity";
import { PermitStatus } from "@domain/enums/permit-status.enum";
import { PageQuery, PageResult } from "@shared/pagination/page-query";

export interface AdminPermitFilters {
  userId?: string;
  locationId?: string;
  status?: PermitStatus;
  startDateFrom?: string;
  startDateTo?: string;
}

export type AdminPermitSortBy = "createdAt" | "startDate" | "endDate";

export abstract class PermitRepository {
  abstract create(permit: Permit): Promise<Permit>;
  abstract save(permit: Permit): Promise<Permit>;
  abstract findById(id: string): Promise<Permit | null>;
  abstract findByIdForUpdate(id: string): Promise<Permit | null>;
  abstract findByQrToken(qrToken: string): Promise<Permit | null>;
  abstract findByUserId(userId: string): Promise<Permit[]>;

  abstract findAdminPage(
    filters: AdminPermitFilters,
    params: PageQuery<AdminPermitSortBy>,
  ): Promise<PageResult<Permit>>;

  abstract expireConfirmedBefore(date: string): Promise<number>;

  abstract countReservedPassengers(
    locationId: string,
    date: string,
    todayDate: string,
    excludePermitId?: string,
  ): Promise<number>;
}
