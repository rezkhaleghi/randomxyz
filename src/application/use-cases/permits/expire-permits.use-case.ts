import { Injectable } from "@nestjs/common";

import { UnitOfWork } from "@application/interfaces/unit-of-work.interface";

@Injectable()
export class ExpirePermitsUseCase {
  constructor(private readonly unitOfWork: UnitOfWork) {}

  execute(): Promise<number> {
    const today = this.getTodayDate();

    return this.unitOfWork.execute(({ permitRepository }) =>
      permitRepository.expireConfirmedBefore(today),
    );
  }

  private getTodayDate(): string {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const day = parts.find((part) => part.type === "day")?.value;

    if (!year || !month || !day) {
      throw new Error("Could not determine the current Tehran date.");
    }

    return `${year}-${month}-${day}`;
  }
}
