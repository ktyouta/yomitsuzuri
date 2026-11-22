import type { AuthorItem, BookItem, WorkItem } from "../../../../domain";

export type GetBookResultType = {
  id: string;
  title: string;
  publishedDate: string | null;
  readingStatusId: number;
  readingStatusLabel: string | null;
  currentPage: number | null;
  memo: string | null;
  iconId: number;
  icon: string | null;
  updatedAt: string;
  works: {
    id: string;
    title: string;
    sort: number | null;
    memo: string | null;
    iconId: number;
    icon: string | null;
    deleteFlg: boolean;
  }[];
  authors: {
    name: string;
  }[];
};

/**
 * 書籍詳細取得結果 DTO
 */
export class GetBookResultDto {
  private readonly _value: GetBookResultType;

  /**
   * @param book 書籍情報
   * @param works 書籍に収録された作品一覧（論理削除済みを含む）
   * @param authors 書籍の著者一覧（表示順）
   */
  constructor(book: BookItem, works: WorkItem[], authors: AuthorItem[]) {
    this._value = {
      id: book.id,
      title: book.title,
      publishedDate: book.publishedDate,
      readingStatusId: book.readingStatusId,
      readingStatusLabel: book.readingStatusLabel,
      currentPage: book.currentPage,
      memo: book.memo,
      iconId: book.iconId,
      icon: book.icon,
      updatedAt: book.updatedAt,
      works: works.map((e) => ({
        id: e.id,
        title: e.title,
        sort: e.sort,
        memo: e.memo,
        iconId: e.iconId,
        icon: e.icon,
        deleteFlg: e.deleteFlg,
      })),
      authors,
    };
  }

  get value(): GetBookResultType {
    return this._value;
  }
}
