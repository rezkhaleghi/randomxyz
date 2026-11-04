export interface PermitSettingsRecord {
  id: string;
  defaultFee: string;
  createdAt: Date;
  updatedAt: Date;
}

export abstract class PermitSettingsRepository {
  abstract findOrCreate(): Promise<PermitSettingsRecord>;

  abstract findOrCreateForUpdate(): Promise<PermitSettingsRecord>;

  abstract save(settings: PermitSettingsRecord): Promise<PermitSettingsRecord>;
}
