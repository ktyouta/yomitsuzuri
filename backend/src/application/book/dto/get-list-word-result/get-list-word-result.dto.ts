import type { WordListItem } from "../../../../domain/book";

export type GetListWordResultType = {
  list: {
    id: string;
    text: string;
    page: number | null;
    updatedAt: string;
  }[];
};

/**
 * 気になるワード一覧取得結果 DTO
 */
export class GetListWordResultDto {
  private readonly _value: GetListWordResultType;

  /**
   * @param list 作品の気になるワード一覧
   */
  constructor(list: WordListItem[]) {
    this._value = {
      list: list.map((e) => ({
        id: e.id,
        text: e.text,
        page: e.page,
        updatedAt: e.updatedAt,
      })),
    };
  }

  get value(): GetListWordResultType {
    return this._value;
  }
}
