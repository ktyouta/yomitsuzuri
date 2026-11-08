import { and, eq, exists } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IUpdateBookRepository } from "../../../../domain";
import { UserId } from "../../../../domain/shared";
import { bookTransaction, workTransaction, type Database } from "../../../db";

/**
 * 書籍更新リポジトリ実装
 */
export class UpdateBookRepository implements IUpdateBookRepository {
  constructor(private readonly db: Database) { }

  /**
   * 更新対象の書籍集約を取得する（論理削除されていない書籍のみ）
   * 作品は集約の更新で全件を扱うため、削除済みを含めて取得する
   * @param userId 書籍を所有するユーザーID
   * @param bookId 更新対象の書籍ID
   * @returns 更新前の書籍集約（存在しない場合は null）
   */
  async findBook(userId: UserId, bookId: BookId): Promise<BookAggregate | null> {
    // 書籍
    const bookResult = await this.db
      .select({
        id: bookTransaction.id,
        userId: bookTransaction.userId,
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
      .where(and(eq(bookTransaction.deleteFlg, false), eq(bookTransaction.userId, userId.value), eq(bookTransaction.id, bookId.value)));

    const book = bookResult[0];
    if (!book) {
      return null;
    }

    // 作品
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
          updatedAt: e.updatedAt,
        })
      ),
      updatedAt: book.updatedAt,
    });
  }

  /**
   * 書籍更新
   * 書籍情報・更新日時を上書きし、削除されていない作品は表示順だけを更新する（作品の更新日時は変更しない）。
   * 書籍の更新日時が expectedUpdatedAt と一致しない場合は、書籍・作品のどちらも更新しない。
   * @param bookAggregate 更新後の状態を表す書籍集約
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  async updateBook(bookAggregate: BookAggregate, expectedUpdatedAt: string): Promise<boolean> {
    const bookSnapshot = bookAggregate.toSnapshot();

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、作品の更新は「書籍がこの更新で更新日時を書き換えた」ことを条件にする
    const bookUpdated = exists(
      this.db
        .select({ id: bookTransaction.id })
        .from(bookTransaction)
        .where(and(eq(bookTransaction.id, bookSnapshot.id), eq(bookTransaction.updatedAt, bookSnapshot.updatedAt)))
    );

    // 書籍だけが更新されて作品が不整合になることを防ぐため、batch で1トランザクションにする
    const [bookResult] = await this.db.batch([
      this.db
        .update(bookTransaction)
        .set({
          title: bookSnapshot.title,
          publishedDate: bookSnapshot.publishedDate,
          readingStatusId: bookSnapshot.readingStatusId,
          currentPage: bookSnapshot.currentPage,
          iconId: bookSnapshot.iconId,
          memo: bookSnapshot.memo,
          updatedAt: bookSnapshot.updatedAt,
        })
        .where(and(
          eq(bookTransaction.deleteFlg, false),
          eq(bookTransaction.userId, bookSnapshot.userId),
          eq(bookTransaction.id, bookSnapshot.id),
          eq(bookTransaction.updatedAt, expectedUpdatedAt),
        ))
        .returning({ id: bookTransaction.id }),
      // 既に削除済みの作品は集約が変更しないため、更新の対象から外す
      ...bookSnapshot.works.filter((e) => !e.deleteFlg).map((e) =>
        this.db
          .update(workTransaction)
          .set({ sortOrder: e.sort })
          .where(and(
            eq(workTransaction.id, e.id),
            eq(workTransaction.bookId, bookSnapshot.id),
            eq(workTransaction.deleteFlg, false),
            bookUpdated,
          ))
      ),
    ]);

    return bookResult.length > 0;
  }
}
