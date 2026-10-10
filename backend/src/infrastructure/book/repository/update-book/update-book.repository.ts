import { and, eq } from "drizzle-orm";
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
        deleteFlg: workTransaction.deleteFlg,
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
        new WorkEntity(
          WorkId.of(e.id),
          new WorkTitle(e.title),
          WorkSort.of(e.sortOrder),
          new WorkMemo(e.memo),
          e.deleteFlg,
        )
      ),
    });
  }

  /**
   * 書籍更新
   * 書籍本体を上書き更新し、作品は ID をキーに upsert する（既存は更新、新規は挿入）。
   * @param bookAggregate 更新後の状態を表す書籍集約
   */
  async updateBook(bookAggregate: BookAggregate): Promise<void> {
    const now = new Date().toISOString();
    const bookSnapshot = bookAggregate.toSnapshot();

    // 書籍だけが更新されて作品が不整合になることを防ぐため、batch で1トランザクションにする
    await this.db.batch([
      this.db
        .update(bookTransaction)
        .set({
          title: bookSnapshot.title,
          publishedDate: bookSnapshot.publishedDate,
          readingStatusId: bookSnapshot.readingStatusId,
          currentPage: bookSnapshot.currentPage,
          iconId: bookSnapshot.iconId,
          memo: bookSnapshot.memo,
          updatedAt: now,
        })
        .where(and(eq(bookTransaction.deleteFlg, false), eq(bookTransaction.userId, bookSnapshot.userId), eq(bookTransaction.id, bookSnapshot.id))),
      ...bookSnapshot.works.map((e) =>
        this.db
          .insert(workTransaction)
          .values({
            id: e.id,
            bookId: bookSnapshot.id,
            title: e.title,
            sortOrder: e.sort,
            memo: e.memo,
            deleteFlg: e.deleteFlg,
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: workTransaction.id,
            set: {
              title: e.title,
              sortOrder: e.sort,
              memo: e.memo,
              deleteFlg: e.deleteFlg,
              updatedAt: now,
            },
            // 他の書籍の作品を上書きしないための保険
            setWhere: eq(workTransaction.bookId, bookSnapshot.id),
          })
      ),
    ]);
  }
}
