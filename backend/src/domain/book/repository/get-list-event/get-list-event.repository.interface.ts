import type { UserId } from "../../../shared";
import type { WorkId } from "../../value-object";

/**
 * 出来事一覧の1件分
 */
export type EventListItem = {
  id: string;
  occurredTiming: string | null;
  content: string;
  sortOrder: number;
};

/**
 * 出来事一覧取得リポジトリインターフェース
 */
export interface IGetListEventRepository {
  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null>;

  /**
   * 作品の出来事一覧を時系列順（sortOrder の昇順、同じ sortOrder 内は ID の昇順）で取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 出来事が属する作品ID
   * @returns 論理削除されていない出来事一覧（作品が取得対象外の場合は空配列）
   */
  findEventList(userId: UserId, workId: WorkId): Promise<EventListItem[]>;
}
