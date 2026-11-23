import type { UserId } from "../../../shared";
import type { WordId } from "../../value-object";

/**
 * 気になるワードの物理削除リポジトリインターフェース
 */
export interface IHardDeleteWordRepository {
  /**
   * 気になるワードの物理削除
   * 指定ユーザーの書籍の、論理削除済みの気になるワードを物理削除する。
   * 存在しない・他ユーザーの書籍の気になるワード・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param wordId 物理削除の対象の気になるワードID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  deleteWord(userId: UserId, wordId: WordId): Promise<boolean>;
}
