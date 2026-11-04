import { Repository } from "typeorm";

import {
  PermitSettingsRecord,
  PermitSettingsRepository,
} from "@domain/repositories/permit-setting.repository";

import { PermitSettingOrmEntity } from "../orm-entities/permit-setting.orm-entity";

export class PermitSettingsRepositoryImpl extends PermitSettingsRepository {
  constructor(private readonly repository: Repository<PermitSettingOrmEntity>) {
    super();
  }

  async findOrCreate(): Promise<PermitSettingsRecord> {
    await this.insertDefaultIfMissing();

    const settings = await this.repository.findOne({
      where: { id: "default" },
    });

    if (!settings) {
      throw new Error("Permit settings could not be initialized.");
    }

    return settings;
  }

  async findOrCreateForUpdate(): Promise<PermitSettingsRecord> {
    await this.insertDefaultIfMissing();

    const settings = await this.repository
      .createQueryBuilder("settings")
      .setLock("pessimistic_write")
      .where("settings.id = :id", { id: "default" })
      .getOne();

    if (!settings) {
      throw new Error("Permit settings could not be initialized.");
    }

    return settings;
  }

  async save(settings: PermitSettingsRecord): Promise<PermitSettingsRecord> {
    return this.repository.save(settings as PermitSettingOrmEntity);
  }

  private async insertDefaultIfMissing(): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .insert()
      .into(PermitSettingOrmEntity)
      .values({
        id: "default",
        defaultFee: "0",
      })
      .orIgnore()
      .execute();
  }
}
