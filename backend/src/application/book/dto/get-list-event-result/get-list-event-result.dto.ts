import type { EventListItem } from "../../../../domain";

export type GetListEventResultType = {
  list: {
    id: string;
    occurredTiming: string | null;
    content: string;
    sortOrder: number;
    deleteFlg: boolean;
  }[];
};

/**
 * 出来事一覧取得結果 DTO
 */
export class GetListEventResultDto {
  private readonly _value: GetListEventResultType;

  /**
   * @param list 作品の出来事一覧（論理削除済みを含む）
   */
  constructor(list: EventListItem[]) {
    this._value = {
      list: list.map((e) => ({
        id: e.id,
        occurredTiming: e.occurredTiming,
        content: e.content,
        sortOrder: e.sortOrder,
        deleteFlg: e.deleteFlg,
      })),
    };
  }

  get value(): GetListEventResultType {
    return this._value;
  }
}
