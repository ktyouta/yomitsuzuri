import type { BookListItem } from "../../../../domain/book";

export type GetListBookResultType = {
  list: {
    id: string;
    title: string;
    updatedAt: string;
    readingStatusId: number;
    readingStatusLabel: string | null;
    workCount: number;
    icon: string | null;
  }[];
  total: number;
  totalPages: number;
};

/**
 * 書籍一覧取得結果 DTO
 */
export class GetListBookResultDto {
  private readonly _value: GetListBookResultType;

  /**
   * @param list 現在のページの書籍一覧
   * @param total 全件数
   * @param totalPages 総ページ数
   */
  constructor(list: BookListItem[], total: number, totalPages: number) {
    this._value = {
      list: list.map((e) => ({
        id: e.id.value,
        title: e.title,
        updatedAt: e.updatedAt,
        readingStatusId: e.readingStatusId.value,
        readingStatusLabel: e.readingStatusLabel,
        workCount: e.workCount,
        icon: e.icon,
      })),
      total,
      totalPages,
    };
  }

  get value(): GetListBookResultType {
    return this._value;
  }
}
