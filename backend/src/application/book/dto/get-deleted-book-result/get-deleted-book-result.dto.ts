import type { AuthorItem, DeletedBookItem, DeletedBookWorkItem } from "../../../../domain";

export type GetDeletedBookResultType = {
  id: string;
  title: string;
  publishedDate: string | null;
  readingStatusId: number;
  readingStatusLabel: string | null;
  currentPage: number | null;
  memo: string | null;
  icon: string | null;
  // 削除日時（復元の楽観ロックにも使う）
  updatedAt: string;
  works: {
    id: string;
    title: string;
    memo: string | null;
    icon: string | null;
  }[];
  authors: {
    name: string;
  }[];
};

/**
 * 削除済みの書籍詳細取得結果 DTO
 */
export class GetDeletedBookResultDto {
  private readonly _value: GetDeletedBookResultType;

  /**
   * @param book 削除済みの書籍情報
   * @param works 書籍に収録された作品一覧（論理削除済みを含む全作品・復元後の並び）
   * @param authors 書籍の著者一覧（論理削除済みを含む全著者・表示順）
   */
  constructor(book: DeletedBookItem, works: DeletedBookWorkItem[], authors: AuthorItem[]) {
    this._value = {
      id: book.id,
      title: book.title,
      publishedDate: book.publishedDate,
      readingStatusId: book.readingStatusId,
      readingStatusLabel: book.readingStatusLabel,
      currentPage: book.currentPage,
      memo: book.memo,
      icon: book.icon,
      updatedAt: book.updatedAt,
      works: works.map((e) => ({
        id: e.id,
        title: e.title,
        memo: e.memo,
        icon: e.icon,
      })),
      authors: authors.map((e) => ({
        name: e.name,
      })),
    };
  }

  get value(): GetDeletedBookResultType {
    return this._value;
  }
}
