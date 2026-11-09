import type { CharacterRelationListItem } from "../../../../domain";

export type GetListCharacterRelationResultType = {
  list: {
    id: string;
    characterId: string;
    characterName: string;
    targetCharacterId: string;
    targetCharacterName: string;
    relationName: string;
    deleteFlg: boolean;
  }[];
};

/**
 * 登場人物関係一覧取得結果 DTO
 */
export class GetListCharacterRelationResultDto {
  private readonly _value: GetListCharacterRelationResultType;

  /**
   * @param list 作品の登場人物関係一覧（論理削除済みの関係を含む）
   */
  constructor(list: CharacterRelationListItem[]) {
    this._value = {
      list: list.map((e) => ({
        id: e.id,
        characterId: e.characterId,
        characterName: e.characterName,
        targetCharacterId: e.targetCharacterId,
        targetCharacterName: e.targetCharacterName,
        relationName: e.relationName,
        deleteFlg: e.deleteFlg,
      })),
    };
  }

  get value(): GetListCharacterRelationResultType {
    return this._value;
  }
}
