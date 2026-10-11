import { and, eq, inArray } from "drizzle-orm";
import type { IconId, IIconValidityRepository } from "../../../../domain/book";
import type { Database } from "../../../db";
import { iconMaster } from "../../../db";

/**
 * アイコン有効性判定リポジトリ実装
 */
export class IconValidityRepository implements IIconValidityRepository {
  constructor(private readonly db: Database) { }

  /**
   * 指定したアイコンのうち、icon_master に存在し有効（未削除）なものの ID を取得する
   * @param iconIds アイコンID（重複なし）
   * @returns 存在し未削除のアイコンの ID
   */
  async findValidIds(iconIds: IconId[]): Promise<number[]> {
    if (iconIds.length === 0) {
      return [];
    }

    const result = await this.db
      .select({ id: iconMaster.id })
      .from(iconMaster)
      .where(and(
        inArray(iconMaster.id, iconIds.map((e) => e.value)),
        eq(iconMaster.deleteFlg, false),
      ));

    return result.map((e) => e.id);
  }
}
