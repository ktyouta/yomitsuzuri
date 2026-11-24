import type { Timestamp, UserId } from "../../../shared";
import type { BookListPagination } from "../../value-object";

/**
 * 書籍一覧の検索条件（日時は From 以上・To 未満で絞り込む。指定がない項目は条件にしない）
 */
export type BookListQueryType = {
  keyword?: string;
  createdAtFrom?: Timestamp;
  createdAtTo?: Timestamp;
  updatedAtFrom?: Timestamp;
  updatedAtTo?: Timestamp;
  page: BookListPagination;
};

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
   * @param query 検索条件（取得するページ番号を含む）
   * @param pageSize 1ページあたりの最大取得件数
   * @returns 検索条件に合う書籍のうち指定ページの一覧
   */
  findBookList(userId: UserId, query: BookListQueryType, pageSize: number): Promise<BookListItem[]>;

  /**
   * ユーザーの書籍のうち検索条件に合う件数を取得
   * @param userId 書籍を所有するユーザーID
   * @param query 検索条件（ページ番号は使わない）
   * @returns ページング適用前の件数
   */
  countBook(userId: UserId, query: BookListQueryType): Promise<number>;
}
