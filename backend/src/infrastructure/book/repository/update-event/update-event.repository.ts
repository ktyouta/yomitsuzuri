import { and, eq } from "drizzle-orm";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, WorkId, type IUpdateEventRepository, type UserId } from "../../../../domain";
import type { Database } from "../../../db";
import { bookTransaction, eventTransaction, workTransaction } from "../../../db";

/**
 * 出来事更新リポジトリ実装
 */
export class UpdateEventRepository implements IUpdateEventRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの出来事を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 出来事（出来事が存在しない・他ユーザーの書籍の出来事・出来事、作品または書籍が論理削除済みの場合は null）
   */
  async findEvent(userId: UserId, eventId: EventId): Promise<EventEntity | null> {
    const [event] = await this.db
      .select({
        id: eventTransaction.id,
        workId: eventTransaction.workId,
        occurredTiming: eventTransaction.occurredTiming,
        content: eventTransaction.content,
        sortOrder: eventTransaction.sortOrder,
        deleteFlg: eventTransaction.deleteFlg,
      })
      .from(eventTransaction)
      // 他ユーザー・論理削除済みの作品や書籍の出来事を返さないため、作品・書籍側の条件で絞り込む
      .innerJoin(workTransaction, eq(eventTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(eventTransaction.id, eventId.value),
        eq(eventTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    if (!event) {
      return null;
    }

    return EventEntity.reconstruct({
      id: EventId.of(event.id),
      workId: WorkId.of(event.workId),
      occurredTiming: EventOccurredTiming.of(event.occurredTiming),
      content: EventContent.of(event.content),
      sortOrder: EventSortOrder.of(event.sortOrder),
      deleteFlg: event.deleteFlg,
    });
  }

  /**
   * 出来事更新
   * @param event 更新後の出来事
   */
  async updateEvent(event: EventEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = event.toSnapshot();

    await this.db.update(eventTransaction)
      .set({
        occurredTiming: snapshot.occurredTiming,
        content: snapshot.content,
        updatedAt: now,
      })
      .where(and(
        eq(eventTransaction.id, snapshot.id),
        eq(eventTransaction.deleteFlg, false),
      ));
  }
}
