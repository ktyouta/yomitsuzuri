import type { BookAggregate } from "../../aggregate";

/**
 * 書籍作成リポジトリインターフェース
 */
export interface ICreateBookRepository {
  /**
   * 書籍作成
   * 書籍と、書籍に収録された作品をまとめて保存する。
   * @param book 作成する書籍集約
   */
  createBook(book: BookAggregate): Promise<void>;
}
