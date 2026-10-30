import type { UserId } from "../../../shared";
import type { EventId } from "../../value-object";

/**
 * 出来事詳細の出来事1件分
 */
export type EventDetail = {
  id: string;
  occurredTiming: string | null;
  content: string;
};

/**
 * 出来事詳細取得リポジトリインターフェース
 */
export interface IGetEventRepository {
  /**
   * 出来事を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 出来事（出来事が存在しない・他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みの場合は null）
   */
  findEvent(userId: UserId, eventId: EventId): Promise<EventDetail | null>;
}
