import type { CharacterListItem } from "../../../../domain/book";

export type GetListCharacterResultType = {
  list: {
    id: string;
    name: string;
    age: string | null;
    occupation: string | null;
    updatedAt: string;
  }[];
};

/**
 * 登場人物一覧取得結果 DTO
 */
export class GetListCharacterResultDto {
  private readonly _value: GetListCharacterResultType;

  /**
   * @param list 作品の登場人物一覧
   */
  constructor(list: CharacterListItem[]) {
    this._value = {
      list: list.map((e) => ({
        id: e.id,
        name: e.name,
        age: e.age,
        occupation: e.occupation,
        updatedAt: e.updatedAt,
      })),
    };
  }

  get value(): GetListCharacterResultType {
    return this._value;
  }
}
