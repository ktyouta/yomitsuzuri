import type { DeletedBookListItem } from "../../../../domain";

export type GetListDeletedBookResultType = {
  list: {
    id: string;
    title: string;
    // 削除日時（復元の楽観ロックにも使う）
    updatedAt: string;
    readingStatusId: number;
    readingStatusLabel: string | null;
    // 削除済みを含む全作品の数
    workCount: number;
    icon: string | null;
  }[];
  total: number;
  totalPages: number;
};

/**
 * 削除済みの書籍一覧取得結果 DTO
 */
export class GetListDeletedBookResultDto {
  private readonly _value: GetListDeletedBookResultType;

  /**
   * @param list 現在のページの削除済みの書籍一覧
   * @param total 全件数
   * @param totalPages 総ページ数
   */
  constructor(list: DeletedBookListItem[], total: number, totalPages: number) {
    this._value = {
      list: list.map((e) => ({
        id: e.id,
        title: e.title,
        updatedAt: e.updatedAt,
        readingStatusId: e.readingStatusId,
        readingStatusLabel: e.readingStatusLabel,
        workCount: e.workCount,
        icon: e.icon,
      })),
      total,
      totalPages,
    };
  }

  get value(): GetListDeletedBookResultType {
    return this._value;
  }
}
