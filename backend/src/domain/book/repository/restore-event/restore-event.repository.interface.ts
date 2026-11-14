import type { UserId } from "../../../shared";
import type { EventTimelineAggregate } from "../../aggregate";
import type { EventEntity } from "../../entity";
import type { EventId } from "../../value-object";

/**
 * 出来事復元リポジトリインターフェース
 */
export interface IRestoreEventRepository {
  /**
   * 出来事が属する作品の、出来事の並びを取得
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 出来事が属する作品の、論理削除済みを含む出来事の並び（出来事が存在しない・他ユーザーの書籍の出来事・作品または書籍が論理削除済みの場合は null）
   */
  findEventTimeline(userId: UserId, eventId: EventId): Promise<EventTimelineAggregate | null>;

  /**
   * 出来事の削除状態と時系列順を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は更新しない。
   * @param eventEntity 削除済みを解除し、時系列順を付けた出来事
   */
  restoreEvent(eventEntity: EventEntity): Promise<void>;
}
