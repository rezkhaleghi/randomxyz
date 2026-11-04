import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";

import { SyncLocationsUseCase } from "@application/use-cases/locations/sync-locations.use-case";

@Injectable()
export class LocationSyncScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(LocationSyncScheduler.name);

  private timer?: NodeJS.Timeout;
  private isRunning = false;

  private readonly intervalMs = 15 * 60 * 1000;

  constructor(private readonly syncLocationsUseCase: SyncLocationsUseCase) {}

  onModuleInit(): void {
    void this.sync();

    this.timer = setInterval(() => {
      void this.sync();
    }, this.intervalMs);

    this.timer.unref();
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async sync(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn("Location synchronization is already running.");
      return;
    }

    this.isRunning = true;

    try {
      const count = await this.syncLocationsUseCase.execute();

      this.logger.log(`Location synchronization completed: ${count} items.`);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown synchronization error";

      this.logger.error(`Location synchronization failed: ${message}`);
    } finally {
      this.isRunning = false;
    }
  }
}
