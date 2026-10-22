import type { CharacterEntity } from "../../../../domain/book";

export type CreateCharacterResultType = {
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
 * 登場人物作成結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class CreateCharacterResultDto {
  private readonly _value: CreateCharacterResultType;

  /**
   * @param character 作成した登場人物
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

  get value(): CreateCharacterResultType {
    return this._value;
  }
}
