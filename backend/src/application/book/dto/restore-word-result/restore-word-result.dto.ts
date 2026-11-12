import type { WordEntity } from "../../../../domain";

export type RestoreWordResultType = {
  id: string;
  workId: string;
  text: string;
  memo: string | null;
  page: number | null;
};

/**
 * 気になるワード復元結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class RestoreWordResultDto {
  private readonly _value: RestoreWordResultType;

  /**
   * @param word 復元した気になるワード
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

  get value(): RestoreWordResultType {
    return this._value;
  }
}
