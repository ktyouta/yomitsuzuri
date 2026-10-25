import type { WordEntity } from "../../../../domain/book";

export type UpdateWordResultType = {
  id: string;
  workId: string;
  text: string;
  memo: string | null;
  page: number | null;
};

/**
 * 気になるワード更新結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class UpdateWordResultDto {
  private readonly _value: UpdateWordResultType;

  /**
   * @param word 更新した気になるワード
   */
  constructor(word: WordEntity) {
    const snapshot = word.toSnapshot();

    this._value = {
      id: snapshot.id,
      workId: snapshot.workId,
      text: snapshot.text,
      memo: snapshot.memo,
      page: snapshot.page,
    };
  }

  get value(): UpdateWordResultType {
    return this._value;
  }
}
