import type { UserId } from "../../../shared";
import type { WordEntity } from "../../entity";
import type { WordId } from "../../value-object";

/**
 * 気になるワード復元リポジトリインターフェース
 */
export interface IRestoreWordRepository {
  /**
   * ユーザーの削除済みの気になるワードを1件取得
   * @param userId 書籍を所有するユーザーID
   * @param wordId 気になるワードID
   * @returns 削除済みの気になるワード（気になるワードが存在しない・削除されていない・他ユーザーの書籍の気になるワード・作品または書籍が論理削除済みの場合は null）
   */
  findWord(userId: UserId, wordId: WordId): Promise<WordEntity | null>;

  /**
   * 気になるワードの削除状態を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は何もしない。
   * @param word 削除済みを解除した気になるワード
   */
  restoreWord(word: WordEntity): Promise<void>;
}
