import type { EventEntity } from "../../../../domain/book";

export type CreateEventResultType = {
  id: string;
  workId: string;
  occurredTiming: string | null;
  content: string;
  sortOrder: number;
};

/**
 * 出来事作成結果 DTO
 * 永続化したエンティティを唯一の情報源として組み立てる（DB の再取得はしない）。
 */
export class CreateEventResultDto {
  private readonly _value: CreateEventResultType;

  /**
   * @param event 作成した出来事
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

  get value(): CreateEventResultType {
    return this._value;
  }
}
