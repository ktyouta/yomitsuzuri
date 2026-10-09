import type { BookAggregate } from "../../../../domain/book";

export type UpdateBookResultType = {
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
  }[];
};

/**
 * 書籍更新結果 DTO
 * 永続化した集約を唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class UpdateBookResultDto {
  private readonly _value: UpdateBookResultType;

  /**
   * @param book 更新後の書籍集約
   */
  constructor(book: BookAggregate) {
    const snapshot = book.toSnapshot();

    // スナップショットには userId・deleteFlg も含まれるため、レスポンスに出す項目だけを詰め替える
    this._value = {
      id: snapshot.id,
      title: snapshot.title,
      publishedDate: snapshot.publishedDate,
      readingStatusId: snapshot.readingStatusId,
      currentPage: snapshot.currentPage,
      memo: snapshot.memo,
      iconId: snapshot.iconId,
      // 論理削除した作品は返さない（書籍詳細取得と同じく、削除されていない作品だけを返す）
      works: snapshot.works
        .filter((e) => !e.deleteFlg)
        .map((e) => ({
          id: e.id,
          title: e.title,
          sort: e.sort,
          memo: e.memo,
        })),
    };
  }

  get value(): UpdateBookResultType {
    return this._value;
  }
}
