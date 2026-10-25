import type { UserId } from "../../../shared";
import type { WorkId } from "../../value-object";

/**
 * 気になるワード一覧の1件分
 */
export type WordListItem = {
  id: string;
  text: string;
  page: number | null;
  updatedAt: string;
};

/**
 * 気になるワード一覧取得リポジトリインターフェース
 */
export interface IGetListWordRepository {
  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null>;

  /**
   * 作品の気になるワード一覧をページの昇順（ページ未入力は末尾、同じページ内は ID の昇順）で取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 気になるワードが属する作品ID
   * @returns 論理削除されていない気になるワード一覧（作品が取得対象外の場合は空配列）
   */
  findWordList(userId: UserId, workId: WorkId): Promise<WordListItem[]>;
}
