import type { UserId } from "../../../shared";
import type { EventId } from "../../value-object";

/**
 * 出来事削除リポジトリインターフェース
 */
export interface IDeleteEventRepository {
  /**
   * ユーザーの出来事を1件物理削除
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 削除した場合は true（出来事が存在しない・他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みの場合は削除せず false）
   */
  deleteEvent(userId: UserId, eventId: EventId): Promise<boolean>;
}
