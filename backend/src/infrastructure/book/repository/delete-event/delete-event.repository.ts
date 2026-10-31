import { and, eq, inArray } from "drizzle-orm";
import type { EventId, IDeleteEventRepository } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, eventTransaction, workTransaction } from "../../../db";

/**
 * 出来事削除リポジトリ実装
 */
export class DeleteEventRepository implements IDeleteEventRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの出来事を1件物理削除
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 削除した場合は true（出来事が存在しない・他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みの場合は削除せず false）
   */
  async deleteEvent(userId: UserId, eventId: EventId): Promise<boolean> {
    // SQLite の DELETE は JOIN できないため、他ユーザー・論理削除済みの作品や書籍の条件はサブクエリで付ける
    const workIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    const deleted = await this.db.delete(eventTransaction)
      .where(and(
        eq(eventTransaction.id, eventId.value),
        eq(eventTransaction.deleteFlg, false),
        inArray(eventTransaction.workId, workIds),
      ))
      .returning({ id: eventTransaction.id });

    return deleted.length > 0;
  }
}
