import type { UserId } from "../../../shared";
import type { BookId, BookListPagination, ReadingStatusId } from "../../value-object";

/**
 * 書籍一覧の1件分
 */
export type BookListItem = {
  id: BookId;
  title: string;
  updatedAt: string;
  readingStatusId: ReadingStatusId;
  // 論理削除された読書状況の場合は null
  readingStatusLabel: string | null;
  workCount: number;
  // 論理削除されたアイコンの場合は null
  icon: string | null;
};

/**
 * 書籍一覧の取得結果
 */
export type BookListPageResult = {
  list: BookListItem[];
  // ページング適用前の全件数
  total: number;
};

/**
 * 書籍一覧取得リポジトリインターフェース
 */
export interface IGetListBookRepository {
  /**
   * ユーザーの書籍一覧を更新日時の降順で取得
   * @param userId 書籍を所有するユーザーID
   * @param pagination 取得するページの範囲
   * @returns 指定ページの書籍一覧と全件数
   */
  findList(userId: UserId, pagination: BookListPagination): Promise<BookListPageResult>;
}
