import type { EventEntity } from "../../../../domain/book";

type UpdateEventResultType = {
  id: string;
  workId: string;
  occurredTiming: string | null;
  content: string;
  sortOrder: number;
};

/**
 * 出来事更新結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class UpdateEventResultDto {
  private readonly _value: UpdateEventResultType;

  /**
   * @param event 更新した出来事
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

  get value(): UpdateEventResultType {
    return this._value;
  }
}
