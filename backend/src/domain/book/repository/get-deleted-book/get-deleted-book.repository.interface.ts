import type { UserId } from "../../../shared";
import type { BookId } from "../../value-object";
import type { AuthorItem } from "../get-book";

/**
 * 削除済みの書籍詳細（ゴミ箱の詳細）の書籍情報
 */
export type DeletedBookItem = {
  id: string;
  title: string;
  publishedDate: string | null;
  readingStatusId: number;
  // 論理削除された読書状況の場合は null
  readingStatusLabel: string | null;
  currentPage: number | null;
  memo: string | null;
  // 論理削除されたアイコンの場合は null
  icon: string | null;
  // 書籍の削除で現在日時に更新するため、削除日時になる（復元の楽観ロックにも使う）
  updatedAt: string;
};

/**
 * 削除済みの書籍詳細の作品一覧の1件分
 */
export type DeletedBookWorkItem = {
  id: string;
  title: string;
  memo: string | null;
  // 論理削除されたアイコンの場合は null
  icon: string | null;
};

/**
 * 削除済みの書籍詳細取得リポジトリインターフェース
 */
export interface IGetDeletedBookRepository {
  /**
   * ユーザーの削除済みの書籍を1件取得
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 書籍情報（存在しない・他ユーザーの書籍・削除されていない書籍の場合は null）
   */
  findDeletedBook(userId: UserId, bookId: BookId): Promise<DeletedBookItem | null>;

  /**
   * 削除済みの書籍に収録された作品一覧を、書籍の復元後の並びで取得（表示順を持つ作品を表示順の昇順で並べ、その後に表示順が NULL の作品を ID の昇順で並べる）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 論理削除済みを含む全作品（書籍が取得対象外の場合は空配列）
   */
  findDeletedBookWork(userId: UserId, bookId: BookId): Promise<DeletedBookWorkItem[]>;

  /**
   * 削除済みの書籍の著者一覧を取得（表示順の昇順・同じ表示順内は ID の昇順）
   * @param userId 書籍を所有するユーザーID
   * @param bookId 書籍ID
   * @returns 論理削除済みを含む全著者（書籍が取得対象外の場合は空配列）
   */
  findDeletedBookAuthor(userId: UserId, bookId: BookId): Promise<AuthorItem[]>;
}
