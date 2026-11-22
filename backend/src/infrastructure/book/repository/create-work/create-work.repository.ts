import { and, eq } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type ICreateWorkRepository } from "../../../../domain";
import { bookTransaction, workTransaction, type Database } from "../../../db";

/**
 * 作品追加リポジトリ実装
 */
export class CreateWorkRepository implements ICreateWorkRepository {
  constructor(private readonly db: Database) { }

  /**
   * 作品を追加する書籍集約を取得する（論理削除されていない書籍のみ）
   * 作品名の重複は削除済みの作品も対象に集約で判定し、表示順の末尾も集約で決めるため、作品は削除済みを含めて全件取得する
   * 著者は取得しない（作品の追加では著者を扱わないため）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 作品を追加する書籍ID
   * @returns 追加前の書籍集約（存在しない・他ユーザーの書籍・論理削除済みの書籍の場合は null）
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
   * 作品追加
   * 作品を書籍に追加して保存する（書籍の更新日時と他の作品は変更しない）。作成日時は作品の更新日時と同じ値にする。
   * @param bookId 作品を追加する書籍ID
   * @param work 追加する作品
   */
  async createWork(bookId: BookId, work: WorkEntity): Promise<void> {
    const snapshot = work.toSnapshot();

    await this.db
      .insert(workTransaction)
      .values({
        id: snapshot.id,
        bookId: bookId.value,
        title: snapshot.title,
        sortOrder: snapshot.sort,
        memo: snapshot.memo,
        iconId: snapshot.iconId,
        deleteFlg: snapshot.deleteFlg,
        createdAt: snapshot.updatedAt,
        updatedAt: snapshot.updatedAt,
      });
  }
}
