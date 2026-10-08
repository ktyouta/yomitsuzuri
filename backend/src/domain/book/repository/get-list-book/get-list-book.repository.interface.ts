import type { UserId } from "../../../shared";
import type { BookListPagination } from "../../value-object";

/**
 * 書籍一覧の1件分
 */
export type BookListItem = {
  id: string;
  title: string;
  updatedAt: string;
  readingStatusId: number;
  // 論理削除された読書状況の場合は null
  readingStatusLabel: string | null;
  workCount: number;
  // 論理削除されたアイコンの場合は null
  icon: string | null;
};

/**
 * 書籍一覧取得リポジトリインターフェース
 */
export interface IGetListBookRepository {
  /**
   * ユーザーの書籍一覧を更新日時の降順で取得
   * @param userId 書籍を所有するユーザーID
   * @param pagination 取得するページ番号
   * @param pageSize 1ページあたりの最大取得件数
   * @returns 指定ページの書籍一覧
   */
  findList(userId: UserId, pagination: BookListPagination, pageSize: number): Promise<BookListItem[]>;

  /**
   * ユーザーの書籍の全件数を取得
   * @param userId 書籍を所有するユーザーID
   * @returns ページング適用前の全件数
   */
  count(userId: UserId): Promise<number>;
}
