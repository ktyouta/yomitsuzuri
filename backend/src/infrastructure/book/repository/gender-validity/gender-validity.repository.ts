import { and, eq } from "drizzle-orm";
import type { GenderId, IGenderValidityRepository } from "../../../../domain/book";
import type { Database } from "../../../db";
import { genderMaster } from "../../../db";

/**
 * 性別有効性判定リポジトリ実装
 */
export class GenderValidityRepository implements IGenderValidityRepository {
  constructor(private readonly db: Database) { }

  /**
   * 指定した性別が gender_master に存在し、有効（未削除）かを判定する
   * @param genderId 性別ID（未入力（null）でないこと）
   * @returns 存在し未削除の場合 true
   * @throws 性別IDが未入力（null）の場合
   */
  async exists(genderId: GenderId): Promise<boolean> {
    const value = genderId.value;
    if (value === null) {
      throw new Error(`未入力の性別IDは判定できません。`);
    }

    const result = await this.db
      .select({ id: genderMaster.id })
      .from(genderMaster)
      .where(and(
        eq(genderMaster.id, value),
        eq(genderMaster.deleteFlg, false),
      ));

    return result.length > 0;
  }
}
