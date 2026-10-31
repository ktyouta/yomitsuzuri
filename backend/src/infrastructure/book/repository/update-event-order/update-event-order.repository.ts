import { and, eq } from "drizzle-orm";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, type IUpdateEventOrderRepository, type UserId, type WorkId } from "../../../../domain";
import { bookTransaction, eventTransaction, workTransaction, type Database } from "../../../db";

/**
 * 出来事の並び順更新リポジトリ実装
 */
export class UpdateEventOrderRepository implements IUpdateEventOrderRepository {

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
   * 出来事の時系列順を更新
   * @param timeline 時系列順を置き換えた出来事の並び
   */
  async updateEventOrder(timeline: EventTimelineAggregate): Promise<void> {
    const now = new Date().toISOString();
    // 一部の出来事だけ時系列順が変わり並びが崩れることを防ぐため、batch で1トランザクションにする。
    // 1件ずつの UPDATE にするのは、D1 の1文あたりのパラメータ数の上限を出来事の件数に関係なく超えないようにするため
    const [first, ...rest] = timeline.toSnapshot().map((event) => this.db
      .update(eventTransaction)
      .set({
        sortOrder: event.sortOrder,
        updatedAt: now,
      })
      .where(and(
        eq(eventTransaction.id, event.id),
        eq(eventTransaction.workId, event.workId),
        eq(eventTransaction.deleteFlg, false),
      )));

    // db.batch は空の配列を受け付けないため、出来事がない場合は何もしない
    if (!first) {
      return;
    }

    await this.db.batch([first, ...rest]);
  }
}
