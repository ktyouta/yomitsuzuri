import { and, eq, exists, inArray } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IRestoreBookRepository } from "../../../../domain";
import { authorTransaction, bookTransaction, characterRelationTransaction, characterTransaction, eventTransaction, wordTransaction, workTransaction, type Database } from "../../../db";

/**
 * 書籍復元リポジトリ実装
 */
export class RestoreBookRepository implements IRestoreBookRepository {
  constructor(private readonly db: Database) { }

  /**
   * 復元対象の書籍集約を取得する（論理削除済みの書籍のみ）
   * 作品は削除済みを含めて全件取得する（復元後の作品の表示順を集約で決めるため。U13）
   * 著者は取得しない（復元では書籍の著者をすべて戻すため、集約で扱う必要がない）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 復元対象の書籍ID
   * @returns 復元前の書籍集約（存在しない・他ユーザーの書籍・削除されていない書籍の場合は null）
   */
  async findBook(userId: UserId, bookId: BookId): Promise<BookAggregate | null> {
    const bookResult = await this.db
      .select({
        id: bookTransaction.id,
        title: bookTransaction.title,
        publishedDate: bookTransaction.publishedDate,
        readingStatusId: bookTransaction.readingStatusId,
        currentPage: bookTransaction.currentPage,
        iconId: bookTransaction.iconId,
        memo: bookTransaction.memo,
        deleteFlg: bookTransaction.deleteFlg,
        updatedAt: bookTransaction.updatedAt,
      })
      .from(bookTransaction)
      .where(and(
        eq(bookTransaction.id, bookId.value),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, true),
      ));

    const book = bookResult[0];
    if (!book) {
      return null;
    }

    const workResult = await this.db
      .select({
        id: workTransaction.id,
        title: workTransaction.title,
        sortOrder: workTransaction.sortOrder,
        memo: workTransaction.memo,
        iconId: workTransaction.iconId,
        deleteFlg: workTransaction.deleteFlg,
        updatedAt: workTransaction.updatedAt,
      })
      .from(workTransaction)
      .where(eq(workTransaction.bookId, book.id));

    return BookAggregate.reconstruct({
      id: BookId.of(book.id),
      title: BookTitle.of(book.title),
      publishedDate: PublishedDate.of(book.publishedDate),
      readingStatusId: ReadingStatusId.of(book.readingStatusId),
      currentPage: CurrentPage.of(book.currentPage),
      iconId: IconId.of(book.iconId),
      memo: BookMemo.of(book.memo),
      userId,
      deleteFlg: book.deleteFlg,
      works: workResult.map((e) =>
        WorkEntity.reconstruct({
          id: WorkId.of(e.id),
          title: WorkTitle.of(e.title),
          sort: WorkSort.of(e.sortOrder),
          memo: WorkMemo.of(e.memo),
          iconId: IconId.of(e.iconId),
          deleteFlg: e.deleteFlg,
          updatedAt: Timestamp.of(e.updatedAt),
        })
      ),
      updatedAt: Timestamp.of(book.updatedAt),
      authors: [],
    });
  }

  /**
   * 復元対象の書籍に収録された作品の、出来事の並びを取得する
   * @param userId 書籍を所有するユーザーID
   * @param workId 作品ID
   * @returns 作品に属する、論理削除済みの出来事の並び（出来事がない・他ユーザーの書籍の作品・書籍が削除されていない場合は空の並び）
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
        eq(eventTransaction.deleteFlg, true),
        eq(workTransaction.deleteFlg, true),
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
   * 書籍復元
   * 書籍の削除フラグ・更新日時を上書きし、書籍の著者・作品と、作品の配下（登場人物・人物関係・気になるワード・出来事）のうち削除済みのものを、
   * 書籍と同じ更新日時で復元する（U10）。作品は引数の書籍集約が持つ表示順で、出来事は引数の出来事の並びが持つ時系列順で保存する（U13）。
   * 書籍・著者・作品・配下は、すべて保存するか、何も保存しないかのどちらかにする（親が有効で子だけ削除済みの状態を作らないため。U14）。
   * 書籍が削除されていない、または書籍の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で更新された場合）は、何も保存しない。
   * @param book 復元後の書籍
   * @param eventTimelineList 削除済みを解除し、時系列順を付けた作品ごとの出来事の並び
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  async restoreBook(book: BookAggregate, eventTimelineList: EventTimelineAggregate[], expectedUpdatedAt: Timestamp): Promise<boolean> {
    const snapshot = book.toSnapshot();
    const eventTimelineSnapshotList = eventTimelineList.map((eventTimeline) => eventTimeline.toSnapshot());

    const workIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .where(and(
        eq(workTransaction.bookId, snapshot.id),
      ));

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、著者・作品・配下の復元は「書籍がこの復元で削除済みでなくなり、更新日時を書き換えた」ことを条件にする
    const bookRestored = exists(
      this.db
        .select({ id: bookTransaction.id })
        .from(bookTransaction)
        .where(and(
          eq(bookTransaction.id, snapshot.id),
          eq(bookTransaction.deleteFlg, snapshot.deleteFlg),
          eq(bookTransaction.updatedAt, snapshot.updatedAt),
        ))
    );

    // 書籍だけが復元されて著者・作品・配下が削除済みのまま残ることを防ぐため、batch で1トランザクションにする（U14）
    // 作品の表示順は書籍集約で、出来事の時系列順は出来事の並びで決めた値で保存する（U13）
    const [result] = await this.db.batch([
      this.db
        .update(bookTransaction)
        .set({
          deleteFlg: snapshot.deleteFlg,
          updatedAt: snapshot.updatedAt,
        })
        .where(and(
          eq(bookTransaction.id, snapshot.id),
          eq(bookTransaction.deleteFlg, true),
          eq(bookTransaction.updatedAt, expectedUpdatedAt.value),
        ))
        .returning({ id: bookTransaction.id }),
      ...snapshot.works.filter((e) => !e.deleteFlg).map((e) =>
        this.db
          .update(workTransaction)
          .set({ sortOrder: e.sort, deleteFlg: false, updatedAt: snapshot.updatedAt })
          .where(and(
            eq(workTransaction.id, e.id),
            eq(workTransaction.bookId, snapshot.id),
            eq(workTransaction.deleteFlg, true),
            bookRestored,
          ))
      ),
      this.db
        .update(characterTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(inArray(characterTransaction.workId, workIds), eq(characterTransaction.deleteFlg, true), bookRestored)),
      this.db
        .update(characterRelationTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(inArray(characterRelationTransaction.workId, workIds), eq(characterRelationTransaction.deleteFlg, true), bookRestored)),
      this.db
        .update(wordTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(inArray(wordTransaction.workId, workIds), eq(wordTransaction.deleteFlg, true), bookRestored)),
      ...eventTimelineSnapshotList.flatMap((eventTimelineSnapshot) => {
        return eventTimelineSnapshot.map((e) => {
          return this.db
            .update(eventTransaction)
            .set({ sortOrder: e.sortOrder, deleteFlg: e.deleteFlg, updatedAt: snapshot.updatedAt })
            .where(and(inArray(eventTransaction.workId, workIds), eq(eventTransaction.id, e.id), eq(eventTransaction.deleteFlg, true), bookRestored))
        })
      }),
      this.db
        .update(authorTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(eq(authorTransaction.bookId, snapshot.id), eq(authorTransaction.deleteFlg, true), bookRestored)),
    ]);

    return result.length > 0;
  }
}
