import { and, eq } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IUpdateWorkRepository } from "../../../../domain";
import { bookTransaction, workTransaction, type Database } from "../../../db";

/**
 * 作品更新リポジトリ実装
 */
export class UpdateWorkRepository implements IUpdateWorkRepository {
  constructor(private readonly db: Database) { }

  /**
   * 更新対象の作品を収録した書籍集約を取得する（論理削除されていない書籍のみ）
   * 作品名の重複は削除済みの作品も対象に集約で判定するため、作品は削除済みを含めて全件取得する
   * @param userId 書籍を所有するユーザーID
   * @param workId 更新対象の作品ID
   * @returns 更新前の書籍集約（存在しない場合は null）
   */
  async findBook(userId: UserId, workId: WorkId): Promise<BookAggregate | null> {
    // 他ユーザー・論理削除済みの書籍の作品を返さないため、書籍側の条件で絞り込む
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
   * 作品更新
   * 対象の作品の作品名・メモ・アイコン・更新日時を上書きする（書籍の更新日時と他の作品は変更しない）。
   * 作品の更新日時が expectedUpdatedAt と一致しない場合は更新しない。
   * @param work 更新後の作品
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  async updateWork(work: WorkEntity, expectedUpdatedAt: Timestamp): Promise<boolean> {
    const snapshot = work.toSnapshot();

    const result = await this.db
      .update(workTransaction)
      .set({
        title: snapshot.title,
        memo: snapshot.memo,
        iconId: snapshot.iconId,
        updatedAt: snapshot.updatedAt,
      })
      .where(and(
        eq(workTransaction.id, snapshot.id),
        eq(workTransaction.deleteFlg, false),
        eq(workTransaction.updatedAt, expectedUpdatedAt.value),
      ))
      .returning({ id: workTransaction.id });

    return result.length > 0;
  }
}
