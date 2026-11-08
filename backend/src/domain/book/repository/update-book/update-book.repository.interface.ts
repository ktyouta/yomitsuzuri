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
   * 書籍情報・更新日時と、書籍に収録された削除されていない作品の表示順を保存する。
   * 保存時点の書籍の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で更新された場合）は、何も保存しない。
   * @param book 更新後の状態を表す書籍集約
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  updateBook(book: BookAggregate, expectedUpdatedAt: string): Promise<boolean>;
}
