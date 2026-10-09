import type { UserId } from "../../../shared";
import type { BookAggregate } from "../../aggregate";
import type { BookId } from "../../value-object";

/**
 * 書籍更新リポジトリインターフェース
 */
export interface IUpdateBookRepository {
  /**
   * 更新対象の書籍集約を取得する（論理削除されていない書籍のみ）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 更新対象の書籍ID
   * @returns 更新前の書籍集約（存在しない・他ユーザーの書籍・論理削除済みの場合は null）
   */
  findBook(userId: UserId, bookId: BookId): Promise<BookAggregate | null>;

  /**
   * 書籍更新
   * 書籍と、書籍に収録された作品をまとめて保存する。
   * @param book 更新後の状態を表す書籍集約
   */
  updateBook(book: BookAggregate): Promise<void>;
}
