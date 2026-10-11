import type { BookAggregate } from "../../../../domain/book";

export type CreateBookResultType = {
  id: string;
  title: string;
  publishedDate: string | null;
  readingStatusId: number;
  currentPage: number | null;
  memo: string | null;
  iconId: number;
  works: {
    id: string;
    title: string;
    sort: number;
    memo: string | null;
    iconId: number;
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
      iconId: snapshot.iconId,
      works: snapshot.works.map((e) => ({
        id: e.id,
        title: e.title,
        sort: e.sort,
        memo: e.memo,
        iconId: e.iconId,
      })),
    };
  }

  get value(): CreateBookResultType {
    return this._value;
  }
}
