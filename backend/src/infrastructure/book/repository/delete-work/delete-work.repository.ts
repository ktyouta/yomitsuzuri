import { and, eq, exists } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IDeleteWorkRepository } from "../../../../domain";
import { bookTransaction, characterRelationTransaction, characterTransaction, eventTransaction, wordTransaction, workTransaction, type Database } from "../../../db";

/**
 * 作品削除リポジトリ実装
 */
export class DeleteWorkRepository implements IDeleteWorkRepository {
  constructor(private readonly db: Database) { }

  /**
   * 削除対象の作品を収録した書籍集約を取得する（論理削除されていない書籍のみ）
   * 削除済みの作品を含めて全件取得する（削除対象が削除済みか、他に削除されていない作品が残るかを集約で判定するため）
   * @param userId 書籍を所有するユーザーID
   * @param workId 削除対象の作品ID
   * @returns 削除前の書籍集約（存在しない場合は null）
   */
  async findBook(userId: UserId, workId: WorkId): Promise<BookAggregate | null> {
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
      .from(workTransaction)
      .innerJoin(bookTransaction, eq(workTransaction.bookId, bookTransaction.id))
      .where(and(
        eq(workTransaction.id, workId.value),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.deleteFlg, false),
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
    });
  }

  /**
   * 作品削除
   * 対象の作品の表示順・削除フラグ・更新日時を上書きし、配下（登場人物・人物関係・気になるワード・出来事）のうち削除されていないものを、
   * 作品と同じ更新日時で論理削除する（書籍と他の作品は変更しない）。
   * 作品が削除済み、または作品の更新日時が expectedUpdatedAt と一致しない場合は、作品・配下のどちらも更新しない。
   * @param work 削除後の作品
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  async deleteWork(work: WorkEntity, expectedUpdatedAt: Timestamp): Promise<boolean> {
    const snapshot = work.toSnapshot();

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、配下の削除は「作品がこの削除で削除済みになり、更新日時を書き換えた」ことを条件にする
    const workDeleted = exists(
      this.db
        .select({ id: workTransaction.id })
        .from(workTransaction)
        .where(and(
          eq(workTransaction.id, snapshot.id),
          eq(workTransaction.deleteFlg, true),
          eq(workTransaction.updatedAt, snapshot.updatedAt),
        ))
    );

    // 作品だけが削除されて配下が有効なまま残ることを防ぐため、batch で1トランザクションにする（U14）
    // 配下の表示順（出来事の時系列順）は変更しない（親の削除に連鎖した削除のため。U13）
    const [workResult] = await this.db.batch([
      this.db
        .update(workTransaction)
        .set({
          sortOrder: snapshot.sort,
          deleteFlg: snapshot.deleteFlg,
          updatedAt: snapshot.updatedAt,
        })
        .where(and(
          eq(workTransaction.id, snapshot.id),
          eq(workTransaction.deleteFlg, false),
          eq(workTransaction.updatedAt, expectedUpdatedAt.value),
        ))
        .returning({ id: workTransaction.id }),
      this.db
        .update(characterTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(eq(characterTransaction.workId, snapshot.id), eq(characterTransaction.deleteFlg, false), workDeleted)),
      this.db
        .update(characterRelationTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(eq(characterRelationTransaction.workId, snapshot.id), eq(characterRelationTransaction.deleteFlg, false), workDeleted)),
      this.db
        .update(wordTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(eq(wordTransaction.workId, snapshot.id), eq(wordTransaction.deleteFlg, false), workDeleted)),
      this.db
        .update(eventTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(eq(eventTransaction.workId, snapshot.id), eq(eventTransaction.deleteFlg, false), workDeleted)),
    ]);

    return workResult.length > 0;
  }
}
