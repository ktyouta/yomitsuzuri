import type { CharacterEntity } from "../../../../domain";

export type RestoreCharacterResultType = {
  id: string;
  workId: string;
  name: string;
  age: string | null;
  genderId: number | null;
  occupation: string | null;
  characteristic: string | null;
  memo: string | null;
};

/**
 * 登場人物復元結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class RestoreCharacterResultDto {
  private readonly _value: RestoreCharacterResultType;

  /**
   * @param character 復元した登場人物
   */
  constructor(character: CharacterEntity) {
    const snapshot = character.toSnapshot();

    this._value = {
      id: snapshot.id,
      workId: snapshot.workId,
      name: snapshot.name,
      age: snapshot.age,
      genderId: snapshot.genderId,
      occupation: snapshot.occupation,
      characteristic: snapshot.characteristic,
      memo: snapshot.memo,
    };
  }

  get value(): RestoreCharacterResultType {
    return this._value;
  }
}
