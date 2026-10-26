import type { UserId } from "../../../shared";
import type { WordId } from "../../value-object";

/**
 * 気になるワード削除リポジトリインターフェース
 */
export interface IDeleteWordRepository {
  /**
   * ユーザーの気になるワードを1件物理削除
   * @param userId 書籍を所有するユーザーID
   * @param wordId 気になるワードID
   * @returns 削除した場合は true（気になるワードが存在しない・他ユーザーの書籍の気になるワード・気になるワード、作品または書籍が論理削除済みの場合は削除せず false）
   */
  deleteWord(userId: UserId, wordId: WordId): Promise<boolean>;
}
