import type { BookAggregate } from "../../../../domain/book";

export type CreateBookResultType = {
  id: string;
  title: string;
  publishedDate: string | null;
  readingStatusId: number;
  currentPage: number | null;
  memo: string | null;
  icon: number;
  works: {
    id: string;
    title: string;
    sort: number;
    memo: string | null;
  }[];
};

/**
 * 書籍作成結果 DTO
 * 永続化した集約を唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class CreateBookResultDto {
  private readonly _value: CreateBookResultType;

  /**
   * @param book 作成した書籍集約
   */
  constructor(book: BookAggregate) {
    const snapshot = book.toSnapshot();

    this._value = {
      id: snapshot.id,
      title: snapshot.title,
      publishedDate: snapshot.publishedDate,
      readingStatusId: snapshot.readingStatusId,
      currentPage: snapshot.currentPage,
      memo: snapshot.memo,
      icon: snapshot.iconId,
      works: snapshot.works.map((e) => ({
        id: e.id,
        title: e.title,
        sort: e.sort,
        memo: e.memo,
      })),
    };
  }

  get value(): CreateBookResultType {
    return this._value;
  }
}
