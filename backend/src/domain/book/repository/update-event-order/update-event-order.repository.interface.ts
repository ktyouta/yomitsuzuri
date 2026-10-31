import type { UserId } from "../../../shared";
import type { EventTimelineAggregate } from "../../aggregate";
import type { WorkId } from "../../value-object";

/**
 * 出来事の並び順更新リポジトリインターフェース
 */
export interface IUpdateEventOrderRepository {
  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null>;

  /**
   * 作品内の出来事の並びを取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品に属する、論理削除されていない出来事の並び（出来事がない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は空の並び）
   */
  findEventTimeline(userId: UserId, workId: WorkId): Promise<EventTimelineAggregate>;

  /**
   * 出来事の時系列順を更新
   * @param timeline 時系列順を置き換えた出来事の並び
   */
  updateEventOrder(timeline: EventTimelineAggregate): Promise<void>;
}
