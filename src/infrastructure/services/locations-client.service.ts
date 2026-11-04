import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { LocationsClient } from "@application/interfaces/locations-client.interface";
import { EnvironmentConfig } from "@infrastructure/config/environment.config";

@Injectable()
export class LocationsClientService extends LocationsClient {
  constructor(
    private readonly configService: ConfigService<EnvironmentConfig>,
  ) {
    super();
  }

  async fetchAvailableLocations(): Promise<unknown> {
    const baseUrl = this.configService
      .getOrThrow("TMAR_TRAVEL_BASE_URL")
      .replace(/\/+$/, "");

    const response = await fetch(`${baseUrl}/locations/sync`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      throw new Error(
        `Tmar-Travel location sync failed with HTTP ${response.status}.`,
      );
    }

    return response.json();
  }
}
