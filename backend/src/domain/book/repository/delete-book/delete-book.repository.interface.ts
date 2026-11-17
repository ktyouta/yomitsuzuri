import type { Timestamp, UserId } from "../../../shared";
import type { BookAggregate } from "../../aggregate";
import type { BookId } from "../../value-object";

/**
 * 書籍削除リポジトリインターフェース
 */
export interface IDeleteBookRepository {
  /**
   * 削除対象の書籍集約を取得する（論理削除されていない書籍のみ。作品は削除済みを含めて取得する）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 削除対象の書籍ID
   * @returns 削除前の書籍集約（書籍が存在しない・他ユーザーの書籍・論理削除済みの書籍の場合は null）
   */
  findBook(userId: UserId, bookId: BookId): Promise<BookAggregate | null>;

  /**
   * 書籍削除
   * 書籍の削除フラグ・更新日時を保存し、書籍の著者・作品と、作品の配下（登場人物・人物関係・気になるワード・出来事）のうち削除されていないものを、
   * 書籍と同じ更新日時で論理削除する（作品・配下の表示順は変更しない。docs/delete-restore/plan.md の U10・U13・U14）。
   * 書籍・著者・作品・配下は、すべて保存するか、何も保存しないかのどちらかにする（親が削除済みで子が有効な状態を作らないため。U14）。
   * 保存時点の書籍が削除済み、または書籍の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で更新された場合）は、何も保存しない。
   * @param book 削除後の書籍
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 保存した場合は true、他の操作で更新されていたため保存しなかった場合は false
   */
  deleteBook(book: BookAggregate, expectedUpdatedAt: Timestamp): Promise<boolean>;
}
