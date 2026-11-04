import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

import { ExpirePermitsUseCase } from "@application/use-cases/permits/expire-permits.use-case";

@Injectable()
export class PermitExpirationScheduler
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PermitExpirationScheduler.name);

  private timer?: NodeJS.Timeout;
  private isRunning = false;

  private readonly intervalMs = 5 * 60 * 1000;

  constructor(private readonly expirePermitsUseCase: ExpirePermitsUseCase) {}

  onModuleInit(): void {
    void this.expire();

    this.timer = setInterval(() => {
      void this.expire();
    }, this.intervalMs);

    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async expire(): Promise<void> {
    if (this.isRunning) return;

    this.isRunning = true;

    try {
      const count = await this.expirePermitsUseCase.execute();

      if (count > 0) {
        this.logger.log(`Expired ${count} permits.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";

      this.logger.error(`Permit expiration failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
