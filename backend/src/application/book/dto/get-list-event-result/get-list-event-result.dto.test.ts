import { describe, it, expect } from "vitest";
import { GetListEventResultDto } from "..";
import type { EventListItem } from "../../../../domain";

describe("GetListEventResultDto", () => {
  it("論理削除済みを含む出来事一覧からDTOを生成できること", () => {
    const list: EventListItem[] = [
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
        occurredTiming: "3日目の夜",
        content: "屋敷の主人が書斎で倒れているのが見つかる",
        sortOrder: 1,
        deleteFlg: false,
      },
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVT1",
        occurredTiming: null,
        content: "執事が鍵の行方を問われる",
        sortOrder: 2,
        deleteFlg: true,
      },
    ];

    const dto = new GetListEventResultDto(list);

    expect(dto.value).toEqual({
      list: [
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
          occurredTiming: "3日目の夜",
          content: "屋敷の主人が書斎で倒れているのが見つかる",
          sortOrder: 1,
          deleteFlg: false,
        },
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVT1",
          occurredTiming: null,
          content: "執事が鍵の行方を問われる",
          sortOrder: 2,
          deleteFlg: true,
        },
      ],
    });
  });
});
