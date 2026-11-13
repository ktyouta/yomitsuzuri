import type { CharacterRelationEntity } from "../../../../domain";

type RestoreCharacterRelationResultType = {
  id: string;
  workId: string;
  characterId: string;
  targetCharacterId: string;
  relationName: string;
};

/**
 * 登場人物関係復元結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class RestoreCharacterRelationResultDto {
  private readonly _value: RestoreCharacterRelationResultType;

  /**
   * @param characterRelation 復元した登場人物関係
   */
  constructor(characterRelation: CharacterRelationEntity) {
    const snapshot = characterRelation.toSnapshot();

    this._value = {
      id: snapshot.id,
      workId: snapshot.workId,
      characterId: snapshot.characterId,
      targetCharacterId: snapshot.targetCharacterId,
      relationName: snapshot.relationName,
    };
  }

  get value(): RestoreCharacterRelationResultType {
    return this._value;
  }
}
