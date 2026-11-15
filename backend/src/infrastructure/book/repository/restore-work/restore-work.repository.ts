import { and, eq, exists } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IRestoreWorkRepository } from "../../../../domain";
import { bookTransaction, characterRelationTransaction, characterTransaction, eventTransaction, wordTransaction, workTransaction, type Database } from "../../../db";

/**
 * 作品復元リポジトリ実装
 */
export class RestoreWorkRepository implements IRestoreWorkRepository {
  constructor(private readonly db: Database) { }

  /**
   * 復元対象の作品を収録した書籍集約を取得する（論理削除されていない書籍のみ）
   * 削除済みの作品を含めて全件取得する（復元対象が削除済みかの判定と、表示順の採番を集約で行うため）
   * @param userId 書籍を所有するユーザーID
   * @param workId 復元対象の作品ID
   * @returns 復元前の書籍集約（存在しない場合は null）
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
   * 作品復元
   * 対象の作品の表示順・削除フラグ・更新日時を上書きし、配下（登場人物・人物関係・気になるワード・出来事）のうち削除済みのものを、
   * 作品と同じ更新日時で復元する（書籍と他の作品は変更しない）。
   * 作品が削除されていない、または作品の更新日時が expectedUpdatedAt と一致しない場合は、作品・配下のどちらも更新しない。
   * @param work 復元後の作品
   * @param expectedUpdatedAt 取得時点の作品の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  async restoreWork(work: WorkEntity, expectedUpdatedAt: Timestamp): Promise<boolean> {
    const snapshot = work.toSnapshot();

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、配下の復元は「作品がこの復元で削除済みでなくなり、更新日時を書き換えた」ことを条件にする
    const workRestored = exists(
      this.db
        .select({ id: workTransaction.id })
        .from(workTransaction)
        .where(and(
          eq(workTransaction.id, snapshot.id),
          eq(workTransaction.deleteFlg, snapshot.deleteFlg),
          eq(workTransaction.updatedAt, snapshot.updatedAt),
        ))
    );

    // 作品だけが復元されて配下が削除済みのまま残ることを防ぐため、batch で1トランザクションにする（U14）
    // 配下の表示順（出来事の時系列順）は変更しない
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
          eq(workTransaction.deleteFlg, true),
          eq(workTransaction.updatedAt, expectedUpdatedAt.value),
        ))
        .returning({ id: workTransaction.id }),
      this.db
        .update(characterTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(eq(characterTransaction.workId, snapshot.id), eq(characterTransaction.deleteFlg, true), workRestored)),
      this.db
        .update(characterRelationTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(eq(characterRelationTransaction.workId, snapshot.id), eq(characterRelationTransaction.deleteFlg, true), workRestored)),
      this.db
        .update(wordTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(eq(wordTransaction.workId, snapshot.id), eq(wordTransaction.deleteFlg, true), workRestored)),
      this.db
        .update(eventTransaction)
        .set({ deleteFlg: false, updatedAt: snapshot.updatedAt })
        .where(and(eq(eventTransaction.workId, snapshot.id), eq(eventTransaction.deleteFlg, true), workRestored)),
    ]);

    return workResult.length > 0;
  }
}
