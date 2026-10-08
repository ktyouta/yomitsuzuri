import { and, eq } from "drizzle-orm";
import type { IconId, IIconValidityRepository } from "../../../../domain/book";
import type { Database } from "../../../db";
import { iconMaster } from "../../../db";

/**
 * アイコン有効性判定リポジトリ実装
 */
export class IconValidityRepository implements IIconValidityRepository {
  constructor(private readonly db: Database) { }

  /**
   * 指定したアイコンが icon_master に存在し、有効（未削除）かを判定する
   * @param iconId アイコンID
   * @returns 存在し未削除の場合 true
   */
  async exists(iconId: IconId): Promise<boolean> {
    const result = await this.db
      .select({ id: iconMaster.id })
      .from(iconMaster)
      .where(and(
        eq(iconMaster.id, iconId.value),
        eq(iconMaster.deleteFlg, false),
      ));

    return result.length > 0;
  }
}
