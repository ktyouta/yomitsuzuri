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
    iconId: number;
    deleteFlg: boolean;
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

    // スナップショットには書籍の userId・deleteFlg も含まれるため、レスポンスに出す項目だけを詰め替える
    this._value = {
      id: snapshot.id,
      title: snapshot.title,
      publishedDate: snapshot.publishedDate,
      readingStatusId: snapshot.readingStatusId,
      currentPage: snapshot.currentPage,
      memo: snapshot.memo,
      iconId: snapshot.iconId,
      // 書籍詳細取得と同じく、論理削除した作品も削除フラグ付きで返す（画面で削除済みとして表示するため）
      works: snapshot.works.map((e) => ({
        id: e.id,
        title: e.title,
        sort: e.sort,
        memo: e.memo,
        iconId: e.iconId,
        deleteFlg: e.deleteFlg,
      })),
    };
  }

  get value(): UpdateBookResultType {
    return this._value;
  }
}
