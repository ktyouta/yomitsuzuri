import { and, eq, inArray } from "drizzle-orm";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, WorkId, type IRestoreEventRepository, type UserId } from "../../../../domain";
import { bookTransaction, eventTransaction, workTransaction, type Database } from "../../../db";

/**
 * 出来事復元リポジトリ実装
 */
export class RestoreEventRepository implements IRestoreEventRepository {

  constructor(private readonly db: Database) { }

  /**
   * 出来事が属する作品の、出来事の並びを取得
   * @param userId 書籍を所有するユーザーID
   * @param eventId 出来事ID
   * @returns 出来事が属する作品の、論理削除済みを含む出来事の並び（出来事が存在しない・他ユーザーの書籍の出来事・作品または書籍が論理削除済みの場合は null）
   */
  async findEventTimeline(userId: UserId, eventId: EventId): Promise<EventTimelineAggregate | null> {
    const targetWork = this.db
      .select({ workId: eventTransaction.workId })
      .from(eventTransaction)
      .where(eq(eventTransaction.id, eventId.value));

    const events = await this.db
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
        inArray(eventTransaction.workId, targetWork),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    // 対象の出来事は削除状態に関係なく結果に含まれるため、含まれなければ取得できない出来事として扱う
    const target = events.find((event) => event.id === eventId.value);
    if (!target) {
      return null;
    }

    const workId = WorkId.of(target.workId);

    return EventTimelineAggregate.reconstruct({
      workId,
      events: events.map((event) => EventEntity.reconstruct({
        id: EventId.of(event.id),
        workId: WorkId.of(event.workId),
        occurredTiming: EventOccurredTiming.of(event.occurredTiming),
        content: EventContent.of(event.content),
        sortOrder: EventSortOrder.of(event.sortOrder),
        deleteFlg: event.deleteFlg,
      })),
    });
  }

  /**
   * 出来事の削除状態と時系列順を保存（復元）
   * 保存時点で削除済みでない場合（取得後に他の操作で復元された場合）は更新しない。
   * @param eventEntity 削除済みを解除し、時系列順を付けた出来事
   */
  async restoreEvent(eventEntity: EventEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = eventEntity.toSnapshot();

    await this.db.update(eventTransaction)
      .set({
        sortOrder: snapshot.sortOrder,
        deleteFlg: snapshot.deleteFlg,
        updatedAt: now,
      })
      .where(and(
        eq(eventTransaction.id, snapshot.id),
        eq(eventTransaction.deleteFlg, true),
      ));
  }
}
