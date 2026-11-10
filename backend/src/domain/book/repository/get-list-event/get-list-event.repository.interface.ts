import type { UserId } from "../../../shared";
import type { WorkId } from "../../value-object";

/**
 * 出来事一覧の1件分
 */
export type EventListItem = {
  id: string;
  occurredTiming: string | null;
  content: string;
  sortOrder: number | null;
  deleteFlg: boolean;
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
   * 作品の出来事一覧を取得（削除されていない出来事を先に、削除済みを末尾に並べ、それぞれ時系列順の昇順・同じ時系列順内は ID の昇順。削除済みのうち時系列順が NULL のものは時系列順を持つものの前に並ぶ）
   * @param userId 書籍を所有するユーザーID
   * @param workId 出来事が属する作品ID
   * @returns 論理削除済みを含む出来事一覧（作品が取得対象外の場合は空配列）
   */
  findEventList(userId: UserId, workId: WorkId): Promise<EventListItem[]>;
}
