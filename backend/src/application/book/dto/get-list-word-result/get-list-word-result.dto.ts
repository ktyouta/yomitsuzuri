import type { WordListItem } from "../../../../domain";

export type GetListWordResultType = {
  list: {
    id: string;
    text: string;
    page: number | null;
    updatedAt: string;
    deleteFlg: boolean;
  }[];
};

/**
 * 気になるワード一覧取得結果 DTO
 */
export class GetListWordResultDto {
  private readonly _value: GetListWordResultType;

  /**
   * @param list 作品の気になるワード一覧（論理削除済みを含む）
   */
  constructor(list: WordListItem[]) {
    this._value = {
      list: list.map((e) => ({
        id: e.id,
        text: e.text,
        page: e.page,
        updatedAt: e.updatedAt,
        deleteFlg: e.deleteFlg,
      })),
    };
  }

  get value(): GetListWordResultType {
    return this._value;
  }
}
