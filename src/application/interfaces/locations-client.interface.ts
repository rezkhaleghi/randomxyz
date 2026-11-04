export abstract class LocationsClient {
  abstract fetchAvailableLocations(): Promise<unknown>;
}
