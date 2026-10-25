import type { UserId } from "../../../shared";
import type { WordEntity } from "../../entity";
import type { WordId } from "../../value-object";

/**
 * 気になるワード更新リポジトリインターフェース
 */
export interface IUpdateWordRepository {
  /**
   * ユーザーの気になるワードを1件取得
   * @param userId 書籍を所有するユーザーID
   * @param wordId 気になるワードID
   * @returns 気になるワード（気になるワードが存在しない・他ユーザーの書籍の気になるワード・気になるワード、作品または書籍が論理削除済みの場合は null）
   */
  findWord(userId: UserId, wordId: WordId): Promise<WordEntity | null>;

  /**
   * 気になるワード更新
   * @param word 更新後の気になるワード
   */
  updateWord(word: WordEntity): Promise<void>;
}
