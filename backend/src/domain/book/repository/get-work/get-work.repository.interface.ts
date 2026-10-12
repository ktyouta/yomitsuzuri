import type { UserId } from "../../../shared";
import type { WorkId } from "../../value-object";

/**
 * 作品詳細の作品1件分
 */
export type WorkType = {
  id: string;
  title: string;
  memo: string | null;
  iconId: number;
  icon: string | null;
  updatedAt: string;
};

/**
 * 作品詳細取得リポジトリインターフェース
 */
export interface IGetWorkRepository {
  /**
   * 作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<WorkType | null>;
}
