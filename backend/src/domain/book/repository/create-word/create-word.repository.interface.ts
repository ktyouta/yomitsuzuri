import type { UserId } from "../../../shared";
import type { WordEntity } from "../../entity";
import type { WorkId } from "../../value-object";

/**
 * 気になるワード作成リポジトリインターフェース
 */
export interface ICreateWordRepository {
  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null>;

  /**
   * 気になるワード作成
   * @param word 作成する気になるワード
   */
  createWord(word: WordEntity): Promise<void>;
}
