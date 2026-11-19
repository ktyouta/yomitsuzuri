import { and, eq, exists, inArray } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IDeleteBookRepository } from "../../../../domain";
import { authorTransaction, bookTransaction, characterRelationTransaction, characterTransaction, eventTransaction, wordTransaction, workTransaction, type Database } from "../../../db";

/**
 * 書籍削除リポジトリ実装
 */
export class DeleteBookRepository implements IDeleteBookRepository {
  constructor(private readonly db: Database) { }

  /**
   * 削除対象の書籍集約を取得する（論理削除されていない書籍のみ。作品は削除済みを含めて取得する）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 削除対象の書籍ID
   * @returns 削除前の書籍集約（存在しない場合は null）
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
      authors: [],
    });
  }

  /**
   * 書籍削除
   * 書籍の削除フラグ・更新日時を上書きし、書籍の著者・作品と、作品の配下（登場人物・人物関係・気になるワード・出来事）のうち削除されていないものを、
   * 書籍と同じ更新日時で論理削除する（作品・配下の表示順は変更しない）。
   * 書籍が削除済み、または書籍の更新日時が expectedUpdatedAt と一致しない場合は、書籍・著者・作品・配下のいずれも更新しない。
   * @param book 削除後の書籍
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  async deleteBook(book: BookAggregate, expectedUpdatedAt: Timestamp): Promise<boolean> {
    const snapshot = book.toSnapshot();

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、著者・作品・配下の削除は「書籍がこの削除で削除済みになり、更新日時を書き換えた」ことを条件にする
    const bookDeleted = exists(
      this.db
        .select({ id: bookTransaction.id })
        .from(bookTransaction)
        .where(and(
          eq(bookTransaction.id, snapshot.id),
          eq(bookTransaction.deleteFlg, true),
          eq(bookTransaction.updatedAt, snapshot.updatedAt),
        ))
    );

    // 書籍に収録された作品のID（削除済みを含む。個別に削除済みの作品の配下は、作品の削除時に削除済みのため deleteFlg で除外される）
    const workIds = this.db
      .select({ id: workTransaction.id })
      .from(workTransaction)
      .where(eq(workTransaction.bookId, snapshot.id));

    // 書籍だけが削除されて著者・作品・配下が有効なまま残ることを防ぐため、batch で1トランザクションにする（U14）
    // 作品・配下の表示順は変更しない（親の削除に連鎖した削除のため。U13）
    const [bookResult] = await this.db.batch([
      this.db
        .update(bookTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(
          eq(bookTransaction.id, snapshot.id),
          eq(bookTransaction.updatedAt, expectedUpdatedAt.value),
          eq(bookTransaction.deleteFlg, false),
        )).returning({ id: bookTransaction.id }),
      this.db
        .update(authorTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(eq(authorTransaction.bookId, snapshot.id), eq(authorTransaction.deleteFlg, false), bookDeleted)),
      this.db
        .update(workTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(eq(workTransaction.bookId, snapshot.id), eq(workTransaction.deleteFlg, false), bookDeleted)),
      this.db
        .update(characterTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(inArray(characterTransaction.workId, workIds), eq(characterTransaction.deleteFlg, false), bookDeleted)),
      this.db
        .update(characterRelationTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(inArray(characterRelationTransaction.workId, workIds), eq(characterRelationTransaction.deleteFlg, false), bookDeleted)),
      this.db
        .update(wordTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(inArray(wordTransaction.workId, workIds), eq(wordTransaction.deleteFlg, false), bookDeleted)),
      this.db
        .update(eventTransaction)
        .set({ deleteFlg: true, updatedAt: snapshot.updatedAt })
        .where(and(inArray(eventTransaction.workId, workIds), eq(eventTransaction.deleteFlg, false), bookDeleted)),
    ]);

    return bookResult.length > 0;
  }
}
