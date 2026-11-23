import type { UserId } from "../../../shared";
import type { BookListPagination } from "../../value-object";

/**
 * 削除済みの書籍一覧（ゴミ箱）の1件分
 */
export type DeletedBookListItem = {
  id: string;
  title: string;
  // 書籍の削除で現在日時に更新するため、削除日時になる
  updatedAt: string;
  readingStatusId: number;
  // 論理削除された読書状況の場合は null
  readingStatusLabel: string | null;
  // 削除済みを含む全作品の数（書籍の復元で戻る作品の数）
  workCount: number;
  // 論理削除されたアイコンの場合は null
  icon: string | null;
};

/**
 * 削除済みの書籍一覧取得リポジトリインターフェース
 */
export interface IGetListDeletedBookRepository {
  /**
   * ユーザーの削除済みの書籍一覧を更新日時の降順で取得
   * @param userId 書籍を所有するユーザーID
   * @param pagination 取得するページ番号
   * @param pageSize 1ページあたりの最大取得件数
   * @returns 指定ページの削除済みの書籍一覧
   */
  findDeletedBookList(userId: UserId, pagination: BookListPagination, pageSize: number): Promise<DeletedBookListItem[]>;

  /**
   * ユーザーの削除済みの書籍の全件数を取得
   * @param userId 書籍を所有するユーザーID
   * @returns ページング適用前の全件数
   */
  countDeletedBook(userId: UserId): Promise<number>;
}
