import { and, eq, exists, sql } from "drizzle-orm";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IUpdateBookRepository } from "../../../../domain";
import { authorTransaction, bookTransaction, workTransaction, type Database } from "../../../db";

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
          updatedAt: Timestamp.of(e.updatedAt),
        })
      ),
      updatedAt: Timestamp.of(book.updatedAt),
      authors: [],
    });
  }

  /**
   * 書籍更新
   * 書籍情報・更新日時を上書きし、削除されていない作品は表示順だけを更新する（作品の更新日時は変更しない）。著者は全件を入れ替える。
   * 書籍の更新日時が expectedUpdatedAt と一致しない場合は、書籍・作品・著者のいずれも更新しない。
   * @param bookAggregate 更新後の状態を表す書籍集約
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  async updateBook(bookAggregate: BookAggregate, expectedUpdatedAt: Timestamp): Promise<boolean> {
    const snapshot = bookAggregate.toSnapshot();

    // batch は文の影響行数が 0 件でも後続の文を取り消さないため、作品の更新は「書籍がこの更新で更新日時を書き換えた」ことを条件にする
    const bookUpdated = exists(
      this.db
        .select({ id: bookTransaction.id })
        .from(bookTransaction)
        .where(and(eq(bookTransaction.id, snapshot.id), eq(bookTransaction.updatedAt, snapshot.updatedAt)))
    );

    // 書籍だけが更新されて作品が不整合になることを防ぐため、batch で1トランザクションにする
    const [bookResult] = await this.db.batch([
      this.db
        .update(bookTransaction)
        .set({
          title: snapshot.title,
          publishedDate: snapshot.publishedDate,
          readingStatusId: snapshot.readingStatusId,
          currentPage: snapshot.currentPage,
          iconId: snapshot.iconId,
          memo: snapshot.memo,
          updatedAt: snapshot.updatedAt,
        })
        .where(and(
          eq(bookTransaction.deleteFlg, false),
          eq(bookTransaction.userId, snapshot.userId),
          eq(bookTransaction.id, snapshot.id),
          eq(bookTransaction.updatedAt, expectedUpdatedAt.value),
        ))
        .returning({ id: bookTransaction.id }),
      // 既に削除済みの作品は集約が変更しないため、更新の対象から外す
      ...snapshot.works.filter((e) => !e.deleteFlg).map((e) =>
        this.db
          .update(workTransaction)
          .set({ sortOrder: e.sort })
          .where(and(
            eq(workTransaction.id, e.id),
            eq(workTransaction.bookId, snapshot.id),
            eq(workTransaction.deleteFlg, false),
            bookUpdated,
          ))
      ),
      // 著者は全件を入れ替える。作品と同じく、書籍がこの更新で更新日時を書き換えた場合だけ削除・登録する
      this.db
        .delete(authorTransaction)
        .where(and(
          eq(authorTransaction.bookId, snapshot.id),
          bookUpdated,
        )),
      // values では条件を付けられないため、書籍の行が更新後の更新日時を持つ場合だけ 1 行を返す select から登録する
      // （insert の列は schema の定義順になり、select の項目と順番で対応するため、項目は schema と同じ順に並べる）
      ...snapshot.authors.map((e) =>
        this.db.insert(authorTransaction).select(
          this.db
            .select({
              id: sql<string>`${e.id}`.as("id"),
              bookId: bookTransaction.id,
              name: sql<string>`${e.name}`.as("name"),
              sortOrder: sql<number>`${e.sortOrder}`.as("sort_order"),
              deleteFlg: sql<boolean>`${e.deleteFlg ? 1 : 0}`.as("delete_flg"),
              createdAt: sql<string>`${snapshot.updatedAt}`.as("created_at"),
              updatedAt: bookTransaction.updatedAt,
            })
            .from(bookTransaction)
            .where(and(eq(bookTransaction.id, snapshot.id), eq(bookTransaction.updatedAt, snapshot.updatedAt)))
        )
      ),
    ]);

    return bookResult.length > 0;
  }
}
