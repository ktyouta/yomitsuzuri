import type { EventDetail } from "../../../../domain";

export type GetEventResultType = {
  id: string;
  occurredTiming: string | null;
  content: string;
};

/**
 * 出来事詳細取得結果 DTO
 */
export class GetEventResultDto {
  private readonly _value: GetEventResultType;

  /**
   * @param event 出来事情報
   */
  constructor(event: EventDetail) {
    this._value = {
      id: event.id,
      occurredTiming: event.occurredTiming,
      content: event.content,
    };
  }

  get value(): GetEventResultType {
    return this._value;
  }
}
