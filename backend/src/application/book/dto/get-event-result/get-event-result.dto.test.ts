import { describe, it, expect } from "vitest";
import { GetEventResultDto } from "..";
import type { EventDetail } from "../../../../domain";

describe("GetEventResultDto", () => {
  it("出来事からDTOを生成できること", () => {
    const event: EventDetail = {
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      occurredTiming: "3日目の夜",
      content: "屋敷の主人が書斎で倒れているのが見つかる",
      deleteFlg: false,
    };

    const dto = new GetEventResultDto(event);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      occurredTiming: "3日目の夜",
      content: "屋敷の主人が書斎で倒れているのが見つかる",
      deleteFlg: false,
    });
  });

  it("発生タイミングが未入力の場合、null のまま返すこと", () => {
    const event: EventDetail = {
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      occurredTiming: null,
      content: "執事が鍵の行方を問われる",
      deleteFlg: false,
    };

    const dto = new GetEventResultDto(event);

    expect(dto.value.occurredTiming).toBeNull();
  });

  it("論理削除済みの出来事の場合、削除フラグを true のまま返すこと", () => {
    const event: EventDetail = {
      id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
      occurredTiming: "3日目の夜",
      content: "屋敷の主人が書斎で倒れているのが見つかる",
      deleteFlg: true,
    };

    const dto = new GetEventResultDto(event);

    expect(dto.value.deleteFlg).toBe(true);
  });
});
