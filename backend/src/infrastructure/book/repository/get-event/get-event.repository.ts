import { and, eq } from "drizzle-orm";
import type { EventDetail, EventId, IGetEventRepository } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction, eventTransaction, workTransaction } from "../../../db";

/**
 * 出来事詳細取得リポジトリ実装
 */
export class GetEventRepository implements IGetEventRepository {
  constructor(private readonly db: Database) { }

  async findEvent(userId: UserId, eventId: EventId): Promise<EventDetail | null> {
    const [event] = await this.db
      .select({
        id: eventTransaction.id,
        occurredTiming: eventTransaction.occurredTiming,
        content: eventTransaction.content,
      })
      .from(eventTransaction)
      .innerJoin(workTransaction, eq(eventTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(eventTransaction.id, eventId.value),
        eq(eventTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false)
      ));

    return event ?? null;
  }
}
