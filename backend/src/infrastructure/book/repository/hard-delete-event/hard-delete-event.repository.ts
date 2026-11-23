import { and, eq, inArray } from "drizzle-orm";
import { EventId, UserId, type IHardDeleteEventRepository } from "../../../../domain";
import { bookTransaction, eventTransaction, workTransaction, type Database } from "../../../db";

/**
 * 出来事の物理削除リポジトリ実装
 */
export class HardDeleteEventRepository implements IHardDeleteEventRepository {
  constructor(private readonly db: Database) { }

  /**
   * 出来事の物理削除
   * 指定ユーザーの書籍の、論理削除済みの出来事を物理削除する。
   * 存在しない・他ユーザーの書籍の出来事・削除されていない（取得後に他の操作で復元された場合を含む）場合は、何も削除しない。
   * @param userId 書籍を所有するユーザーID
   * @param eventId 物理削除の対象の出来事ID
   * @returns 削除した場合は true、対象がなく削除しなかった場合は false
   */
  async deleteEvent(userId: UserId, eventId: EventId): Promise<boolean> {
    // 指定ユーザーの書籍に収録された作品のID（所有者の確認に使う）
    const userWorkIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(eq(bookTransaction.userId, userId.value));

    // 出来事は配下を持たないため、1文で削除する
    const deleted = await this.db
      .delete(eventTransaction)
      .where(and(
        eq(eventTransaction.id, eventId.value),
        eq(eventTransaction.deleteFlg, true),
        inArray(eventTransaction.workId, userWorkIds),
      ))
      .returning({ id: eventTransaction.id });

    return deleted.length > 0;
  }
}
