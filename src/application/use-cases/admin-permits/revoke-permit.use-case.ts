import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

import { AuditLog } from "@domain/entities/audit-log.entity";
import { Ledger } from "@domain/entities/ledger.entity";

import { AuditAction } from "@domain/enums/audit-action.enum";
import { LedgerType } from "@domain/enums/ledger-type.enum";
import { PermitStatus } from "@domain/enums/permit-status.enum";

import { isZeroDecimal } from "@domain/utils/decimal.util";

export interface RevokePermitInput {
  permitId: string;
  actorUserId: string;
  reason: string;
}

@Injectable()
export class AdminRevokePermitUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  async execute(input: RevokePermitInput) {
    if (!input.reason?.trim()) {
      throw new BadRequestException("A reason is required.");
    }

    return this.unitOfWork.execute(async (repositories) => {
      const initialPermit = await repositories.permitRepository.findById(
        input.permitId,
      );

      if (!initialPermit) {
        throw new NotFoundException("Permit not found.");
      }

      const location = await repositories.locationRepository.findByIdForUpdate(
        initialPermit.locationId,
      );

      if (!location) {
        throw new NotFoundException("Location not found.");
      }

      const permit = await repositories.permitRepository.findByIdForUpdate(
        input.permitId,
      );

      if (!permit) {
        throw new NotFoundException("Permit not found.");
      }

      if (
        permit.status !== PermitStatus.CONFIRMED &&
        permit.status !== PermitStatus.EXPIRED
      ) {
        throw new ConflictException(
          `A permit with status ${permit.status} cannot be revoked.`,
        );
      }

      let refundAmount = "0";

      if (!isZeroDecimal(permit.totalAmount)) {
        const balance =
          await repositories.userBalanceRepository.findByUserIdAndCurrencyForUpdate(
            permit.userId,
            permit.currency,
          );

        if (!balance) {
          throw new InternalServerErrorException(
            "The permit payment balance could not be found.",
          );
        }

        const balanceBefore = balance.amount;

        balance.credit(permit.totalAmount);

        const savedBalance =
          await repositories.userBalanceRepository.save(balance);

        await repositories.ledgerRepository.create(
          Ledger.create({
            userId: permit.userId,
            currency: permit.currency,
            amount: permit.totalAmount,
            balanceBefore,
            balanceAfter: savedBalance.amount,
            type: LedgerType.REFUND,
            actorUserId: input.actorUserId,
            referenceId: permit.id,
            metadata: {
              permitId: permit.id,
              reason: input.reason.trim(),
            },
          }),
        );

        refundAmount = permit.totalAmount;
      }

      const previousStatus = permit.status;

      permit.revoke();

      await repositories.permitRepository.save(permit);

      await repositories.auditLogRepository.create(
        AuditLog.create({
          actorUserId: input.actorUserId,
          targetUserId: permit.userId,
          action: AuditAction.PERMIT_REVOKED,
          metadata: {
            permitId: permit.id,
            reason: input.reason.trim(),
            previousStatus,
            newStatus: permit.status,
            refundAmount,
            currency: permit.currency,
          },
        }),
      );

      return {
        id: permit.id,
        status: permit.status,
        refundAmount,
        currency: permit.currency,
      };
    });
  }
}
