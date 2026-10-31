import type { UserId } from "../../../shared";
import type { EventEntity } from "../../entity";
import type { EventId } from "../../value-object";

/**
 * 出来事更新リポジトリインターフェース
 */
export interface IUpdateEventRepository {
  /**
   * ユーザーの出来事を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 出来事（出来事が存在しない・他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みの場合は null）
   */
  findEvent(userId: UserId, eventId: EventId): Promise<EventEntity | null>;

  /**
   * 出来事更新
   * @param event 更新後の出来事
   */
  updateEvent(event: EventEntity): Promise<void>;
}
