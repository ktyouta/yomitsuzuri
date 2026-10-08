import type { BookAggregate, ICreateBookRepository } from "../../../../domain/book";
import type { Database } from "../../../db";
import { bookTransaction, workTransaction } from "../../../db";

/**
 * 書籍作成リポジトリ実装
 */
export class CreateBookRepository implements ICreateBookRepository {

  constructor(private readonly db: Database) { }

  /**
   * 書籍作成
   * 書籍と、書籍に収録された作品をまとめて保存する。
   * @param book 作成する書籍集約
   */
  async createBook(book: BookAggregate): Promise<void> {
    const now = new Date().toISOString();
    const snapshot = book.toSnapshot();

    // 書籍だけが保存されて作品が0件になることを防ぐため、batch で1トランザクションにする
    await this.db.batch([
      this.db.insert(bookTransaction).values({
        id: snapshot.id,
        userId: snapshot.userId,
        title: snapshot.title,
        publishedDate: snapshot.publishedDate,
        readingStatusId: snapshot.readingStatusId,
        currentPage: snapshot.currentPage,
        memo: snapshot.memo,
        icon: snapshot.iconId,
        deleteFlg: snapshot.deleteFlg,
        createdAt: now,
        updatedAt: now,
      }),
      ...snapshot.works.map((e) =>
        this.db.insert(workTransaction).values({
          id: e.id,
          bookId: snapshot.id,
          title: e.title,
          sortOrder: e.sort,
          memo: e.memo,
          deleteFlg: e.deleteFlg,
          createdAt: now,
          updatedAt: now,
        })
      ),
    ]);
  }
}
