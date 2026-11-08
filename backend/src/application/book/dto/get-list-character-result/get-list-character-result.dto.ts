import type { CharacterListItem } from "../../../../domain";

export type GetListCharacterResultType = {
  list: {
    id: string;
    name: string;
    age: string | null;
    occupation: string | null;
    updatedAt: string;
    deleteFlg: boolean;
  }[];
};

/**
 * 登場人物一覧取得結果 DTO
 */
export class GetListCharacterResultDto {
  private readonly _value: GetListCharacterResultType;

  /**
   * @param list 作品の登場人物一覧（論理削除済みを含む）
   */
  constructor(list: CharacterListItem[]) {
    this._value = {
      list: list.map((e) => ({
        id: e.id,
        name: e.name,
        age: e.age,
        occupation: e.occupation,
        updatedAt: e.updatedAt,
        deleteFlg: e.deleteFlg,
      })),
    };
  }

  get value(): GetListCharacterResultType {
    return this._value;
  }
}
