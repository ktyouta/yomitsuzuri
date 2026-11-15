import type { EventEntity } from "../../../../domain";

type RestoreEventResultType = {
  id: string;
  workId: string;
  occurredTiming: string | null;
  content: string;
  sortOrder: number | null;
};

/**
 * 出来事復元結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class RestoreEventResultDto {
  private readonly _value: RestoreEventResultType;

  /**
   * @param event 復元した出来事
   */
  constructor(event: EventEntity) {
    const snapshot = event.toSnapshot();

    this._value = {
      id: snapshot.id,
      workId: snapshot.workId,
      occurredTiming: snapshot.occurredTiming,
      content: snapshot.content,
      sortOrder: snapshot.sortOrder,
    };
  }

  get value(): RestoreEventResultType {
    return this._value;
  }
}
