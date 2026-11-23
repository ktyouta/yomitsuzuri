import type { UserId } from "../../../shared";
import type { EventId } from "../../value-object";

/**
 * 出来事の物理削除リポジトリインターフェース
 */
export interface IHardDeleteEventRepository {
  /**
   * 出来事の物理削除
   * 指定ユーザーの書籍の、論理削除済みの出来事を物理削除する。
   * 存在しない・他ユーザーの書籍の出来事・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param eventId 物理削除の対象の出来事ID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  deleteEvent(userId: UserId, eventId: EventId): Promise<boolean>;
}
