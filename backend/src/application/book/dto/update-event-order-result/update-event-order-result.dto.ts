import type { EventTimelineAggregate } from "../../../../domain";

type UpdateEventOrderResultType = {
  list: {
    id: string;
    occurredTiming: string | null;
    content: string;
    sortOrder: number;
  }[];
};

/**
 * 出来事の並び順更新結果 DTO
 * 永続化した集約を唯一の情報源として組み立てる（DB の再取得はしない）。
 * 出来事一覧の取得と同じ形で返し、画面がレスポンスで一覧を描き直せるようにする。
 */
export class UpdateEventOrderResultDto {
  private readonly _value: UpdateEventOrderResultType;

  /**
   * @param timeline 時系列順を置き換えた出来事の並び
   * @throws 削除されていない出来事が時系列順を持たない場合（集約の不変条件違反）
   */
  constructor(timeline: EventTimelineAggregate) {
    this._value = {
      // 並び替えの対象は削除されていない出来事だけのため、削除済みは返さない
      list: timeline.toSnapshot()
        .flatMap((event) => {
          if (event.deleteFlg) {
            return [];
          }
          if (event.sortOrder === null) {
            throw new Error(`時系列順を持たない出来事が含まれています。eventId:${event.id}`);
          }

          return [{
            id: event.id,
            occurredTiming: event.occurredTiming,
            content: event.content,
            sortOrder: event.sortOrder,
          }];
        })
        // 集約は出来事を元の順番のまま保持するため、置き換え後の時系列順で並べる
        .sort((a, b) => a.sortOrder - b.sortOrder),
    };
  }

  get value(): UpdateEventOrderResultType {
    return this._value;
  }
}
