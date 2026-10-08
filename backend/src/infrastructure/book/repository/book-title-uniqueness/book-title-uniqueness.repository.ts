import { and, eq, ne } from "drizzle-orm";
import type { BookId, BookTitle, IBookTitleUniquenessRepository } from "../../../../domain/book";
import type { UserId } from "../../../../domain/shared";
import type { Database } from "../../../db";
import { bookTransaction } from "../../../db";

/**
 * 書籍タイトル一意性判定リポジトリ実装
 */
export class BookTitleUniquenessRepository implements IBookTitleUniquenessRepository {
  constructor(private readonly db: Database) { }

  /**
   * 同名書籍の取得（同一ユーザー内・未削除のもの）
   * bookId 自身は除外する（更新時の自己重複を防ぐ）。
   * @param userId 書籍を所有するユーザーID
   * @param bookId 判定対象から除外する書籍ID
   * @param bookTitle 書籍タイトル
   * @returns 同名書籍の ID 一覧
   */
  async findBook(userId: UserId, bookId: BookId, bookTitle: BookTitle): Promise<{ id: string }[]> {
    const result = await this.db
      .select({
        id: bookTransaction.id,
      })
      .from(bookTransaction)
      .where(and(
        eq(bookTransaction.deleteFlg, false),
        eq(bookTransaction.userId, userId.value),
        eq(bookTransaction.title, bookTitle.value),
        ne(bookTransaction.id, bookId.value),
      ));

    return result;
  }
}
