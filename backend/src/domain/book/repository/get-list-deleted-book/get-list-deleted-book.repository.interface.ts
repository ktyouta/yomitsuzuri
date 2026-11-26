import type { Timestamp, UserId } from "../../../shared";
import type { BookListPagination, BookListSort } from "../../value-object";

/**
 * 削除済みの書籍一覧（ゴミ箱）の検索条件（日時は From 以上・To 未満で絞り込む。指定がない項目は条件にしない）
 */
export type DeletedBookListQueryType = {
  keyword?: string;
  createdAtFrom?: Timestamp;
  createdAtTo?: Timestamp;
  // 書籍の削除で現在日時に更新するため、削除日時での絞り込みになる
  updatedAtFrom?: Timestamp;
  updatedAtTo?: Timestamp;
  // 更新日時での並び替えは、削除日時での並び替えになる
  bookListSort: BookListSort;
  page: BookListPagination;
};

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
   * ユーザーの削除済みの書籍一覧を検索条件の並び順で取得
   * @param userId 書籍を所有するユーザーID
   * @param query 検索条件（取得するページ番号を含む）
   * @param pageSize 1ページあたりの最大取得件数
   * @returns 検索条件に合う削除済みの書籍のうち指定ページの一覧
   */
  findDeletedBookList(userId: UserId, query: DeletedBookListQueryType, pageSize: number): Promise<DeletedBookListItem[]>;

  /**
   * ユーザーの削除済みの書籍のうち検索条件に合う件数を取得
   * @param userId 書籍を所有するユーザーID
   * @param query 検索条件（ページ番号は使わない）
   * @returns ページング適用前の件数
   */
  countDeletedBook(userId: UserId, query: DeletedBookListQueryType): Promise<number>;
}
