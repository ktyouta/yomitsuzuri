import type { UserId } from "../../../shared";
import type { BookId } from "../../value-object";

/**
 * 書籍詳細の書籍情報
 */
export type BookItem = {
  id: string;
  title: string;
  publishedDate: string | null;
  readingStatusId: number;
  // 論理削除された読書状況の場合は null
  readingStatusLabel: string | null;
  currentPage: number | null;
  memo: string | null;
  iconId: number;
  // 論理削除されたアイコンの場合は null
  icon: string | null;
  updatedAt: string;
};

/**
 * 書籍詳細の作品一覧の1件分
 */
export type WorkItem = {
  id: string;
  title: string;
  sort: number;
  memo: string | null;
};

/**
 * 書籍詳細取得リポジトリインターフェース
 */
export interface IGetBookRepository {
  /**
   * ユーザーの書籍を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 書籍情報（存在しない・他ユーザーの書籍・論理削除済みの場合は null）
   */
  findBook(userId: UserId, bookId: BookId): Promise<BookItem | null>;

  /**
   * 書籍に収録された作品一覧を表示順の昇順で取得
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 論理削除されていない作品一覧（書籍が取得対象外の場合は空配列）
   */
  findWork(userId: UserId, bookId: BookId): Promise<WorkItem[]>;
}
