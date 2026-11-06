import type { UserId } from "../../../shared";
import type { WordEntity } from "../../entity";
import type { WordId } from "../../value-object";

/**
 * 気になるワード削除リポジトリインターフェース
 */
export interface IDeleteWordRepository {
  /**
   * ユーザーの気になるワードを1件取得
   * @param userId 書籍を所有するユーザーID
   * @param wordId 気になるワードID
   * @returns 気になるワード（気になるワードが存在しない・他ユーザーの書籍の気になるワード・気になるワード、作品または書籍が論理削除済みの場合は null）
   */
  findWord(userId: UserId, wordId: WordId): Promise<WordEntity | null>;

  /**
   * 気になるワードの削除状態を保存（論理削除）
   * @param word 削除済みにした気になるワード
   */
  deleteWord(word: WordEntity): Promise<void>;
}
