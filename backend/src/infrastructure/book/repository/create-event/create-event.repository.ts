import { and, eq } from "drizzle-orm";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, type ICreateEventRepository, type UserId, type WorkId } from "../../../../domain";
import { bookTransaction, eventTransaction, workTransaction, type Database } from "../../../db";

/**
 * 出来事作成リポジトリ実装
 */
export class CreateEventRepository implements ICreateEventRepository {

  constructor(private readonly db: Database) { }

  /**
   * ユーザーの作品を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品の ID（作品が存在しない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は null）
   */
  async findWork(userId: UserId, workId: WorkId): Promise<{ id: string } | null> {
    const [work] = await this.db
      .select({
        id: workTransaction.id,
      })
      .from(workTransaction)
      // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(workTransaction.id, workId.value),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    return work ?? null;
  }

  /**
   * 作品内の出来事の並びを取得
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品に属する、論理削除されていない出来事の並び（出来事がない・他ユーザーの書籍の作品・作品または書籍が論理削除済みの場合は空の並び）
   */
  async findEventTimeline(userId: UserId, workId: WorkId): Promise<EventTimelineAggregate> {
    const events = await this.db
      .select({
        id: eventTransaction.id,
        occurredTiming: eventTransaction.occurredTiming,
        content: eventTransaction.content,
        sortOrder: eventTransaction.sortOrder,
        deleteFlg: eventTransaction.deleteFlg,
      })
      .from(eventTransaction)
      // 所有者の確認を呼び出し順に頼らないため、作品・書籍側の条件でも絞り込む
      .innerJoin(workTransaction, eq(eventTransaction.workId, workTransaction.id))
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(eventTransaction.workId, workId.value),
        eq(eventTransaction.deleteFlg, false),
        eq(workTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
      ));

    return EventTimelineAggregate.reconstruct({
      workId,
      events: events.map((event) => EventEntity.reconstruct({
        id: EventId.of(event.id),
        workId,
        occurredTiming: EventOccurredTiming.of(event.occurredTiming),
        content: EventContent.of(event.content),
        sortOrder: EventSortOrder.of(event.sortOrder),
        deleteFlg: event.deleteFlg,
      })),
    });
  }

  /**
   * 出来事作成
   * @param event 作成する出来事（出来事の並びに追加したもの）
   */
  async createEvent(event: EventEntity): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = event.toSnapshot();

    await this.db.insert(eventTransaction).values({
      id: snapshot.id,
      workId: snapshot.workId,
      occurredTiming: snapshot.occurredTiming,
      content: snapshot.content,
      sortOrder: snapshot.sortOrder,
      deleteFlg: snapshot.deleteFlg,
      createdAt: now,
      updatedAt: now,
    });
  }
}
