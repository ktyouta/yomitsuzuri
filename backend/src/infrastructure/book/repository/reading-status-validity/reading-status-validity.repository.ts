import { and, eq } from "drizzle-orm";
import type { ReadingStatusId, IReadingStatusValidityRepository } from "../../../../domain/book";
import type { Database } from "../../../db";
import { readingStatusMaster } from "../../../db";

/**
 * 読書状況有効性判定リポジトリ実装
 */
export class ReadingStatusValidityRepository implements IReadingStatusValidityRepository {
  constructor(private readonly db: Database) { }

  /**
   * 指定した読書状況が reading_status_master に存在し、有効（未削除）かを判定する
   * @param readingStatusId 読書状況ID
   * @returns 存在し未削除の場合 true
   */
  async exists(readingStatusId: ReadingStatusId): Promise<boolean> {
    const result = await this.db
      .select({ id: readingStatusMaster.id })
      .from(readingStatusMaster)
      .where(and(
        eq(readingStatusMaster.id, readingStatusId.value),
        eq(readingStatusMaster.deleteFlg, false),
      ));

    return result.length > 0;
  }
}
