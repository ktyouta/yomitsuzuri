import type { CharacterDetail, CharacterDetailRelationItem } from "../../../../domain/book";

export type GetCharacterResultType = {
  id: string;
  workId: string;
  name: string;
  age: string | null;
  genderId: number | null;
  genderLabel: string | null;
  occupation: string | null;
  characteristic: string | null;
  memo: string | null;
  updatedAt: string;
  deleteFlg: boolean;
  relations: {
    id: string;
    characterId: string;
    characterName: string;
    targetCharacterId: string;
    targetCharacterName: string;
    relationName: string;
  }[];
};

/**
 * 登場人物詳細取得結果 DTO
 */
export class GetCharacterResultDto {
  private readonly _value: GetCharacterResultType;

  /**
   * @param character 登場人物（論理削除済みを含む）
   * @param relations 登場人物が人物または相手である関係の一覧
   */
  constructor(character: CharacterDetail, relations: CharacterDetailRelationItem[]) {
    this._value = {
      id: character.id,
      workId: character.workId,
      name: character.name,
      age: character.age,
      genderId: character.genderId,
      genderLabel: character.genderLabel,
      occupation: character.occupation,
      characteristic: character.characteristic,
      memo: character.memo,
      updatedAt: character.updatedAt,
      deleteFlg: character.deleteFlg,
      relations: relations.map((e) => ({
        id: e.id,
        characterId: e.characterId,
        characterName: e.characterName,
        targetCharacterId: e.targetCharacterId,
        targetCharacterName: e.targetCharacterName,
        relationName: e.relationName,
      })),
    };
  }

  get value(): GetCharacterResultType {
    return this._value;
  }
}
