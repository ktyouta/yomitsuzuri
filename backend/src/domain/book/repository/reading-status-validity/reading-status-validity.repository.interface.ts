import type { ReadingStatusId } from "../../value-object";

/**
 * 読書状況有効性判定リポジトリインターフェース
 */
export interface IReadingStatusValidityRepository {
  /**
   * 指定した読書状況が reading_status_master に存在し、有効（未削除）かを判定する
   * @param readingStatusId 読書状況ID
   * @returns 存在し未削除の場合 true
   */
  exists(readingStatusId: ReadingStatusId): Promise<boolean>;
}
