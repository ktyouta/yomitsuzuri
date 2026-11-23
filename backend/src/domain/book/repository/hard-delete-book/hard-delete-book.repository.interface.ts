import type { Timestamp, UserId } from "../../../shared";
import type { BookId } from "../../value-object";

/**
 * 書籍の物理削除リポジトリインターフェース
 */
export interface IHardDeleteBookRepository {
  /**
   * 物理削除の対象の書籍を取得する（論理削除済みの書籍のみ）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 物理削除の対象の書籍ID
   * @returns 書籍の更新日時（存在しない・他ユーザーの書籍・削除されていない書籍の場合は null）
   */
  findBook(userId: UserId, bookId: BookId): Promise<{ updatedAt: Timestamp } | null>;

  /**
   * 書籍の物理削除
   * 書籍と、書籍の著者・作品・作品の配下（登場人物・人物関係・気になるワード・出来事）を、削除フラグに関係なくすべて物理削除する。
   * すべて削除するか、何も削除しないかのどちらかにする（親のない子を残さないため）。
   * 保存時点の書籍が削除済みでない、または書籍の更新日時が expectedUpdatedAt と一致しない場合（取得後に他の操作で復元・更新された場合）は、何も削除しない。
   * @param bookId 物理削除の対象の書籍ID
   * @param expectedUpdatedAt 取得時点の書籍の更新日時
   * @returns 削除した場合は true、他の操作で更新されていたため削除しなかった場合は false
   */
  deleteBook(bookId: BookId, expectedUpdatedAt: Timestamp): Promise<boolean>;
}
