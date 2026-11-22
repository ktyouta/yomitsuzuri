import type { BookAggregate } from "../../../../domain";

export type RestoreBookResultType = {
  id: string;
  title: string;
  publishedDate: string | null;
  readingStatusId: number;
  currentPage: number | null;
  memo: string | null;
  iconId: number;
  updatedAt: string;
  works: {
    id: string;
    title: string;
    sort: number | null;
    memo: string | null;
    iconId: number;
    deleteFlg: boolean;
  }[];
  authors: {
    name: string;
  }[];
};

/**
 * 書籍復元結果 DTO
 * 永続化した集約を唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class RestoreBookResultDto {
  private readonly _value: RestoreBookResultType;

  /**
   * @param book 復元後の書籍集約
   */
  constructor(book: BookAggregate) {
    const snapshot = book.toSnapshot();

    // スナップショットには書籍の userId・deleteFlg も含まれるため、レスポンスに出す項目だけを詰め替える
    this._value = {
      id: snapshot.id,
      title: snapshot.title,
      publishedDate: snapshot.publishedDate,
      readingStatusId: snapshot.readingStatusId,
      currentPage: snapshot.currentPage,
      memo: snapshot.memo,
      iconId: snapshot.iconId,
      updatedAt: snapshot.updatedAt,
      // 書籍の復元で作品はすべて復元されるが、書籍詳細取得・書籍更新と同じ形で返すため削除フラグも含める
      works: snapshot.works.map((e) => ({
        id: e.id,
        title: e.title,
        sort: e.sort,
        memo: e.memo,
        iconId: e.iconId,
        deleteFlg: e.deleteFlg,
      })),
      authors: snapshot.authors.map((e) => ({
        name: e.name,
      })),
    };
  }

  get value(): RestoreBookResultType {
    return this._value;
  }
}
