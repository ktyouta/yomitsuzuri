import { describe, it, expect } from "vitest";
import { GetListWordResultDto } from "..";
import type { WordListItem } from "../../../../domain/book";

describe("GetListWordResultDto", () => {
  it("気になるワード一覧からDTOを生成できること", () => {
    const list: WordListItem[] = [
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
        text: "赤い手帳",
        page: 12,
        updatedAt: "2026-10-01T00:00:00.000Z",
      },
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVT1",
        text: "青い封筒",
        page: null,
        updatedAt: "2026-10-02T00:00:00.000Z",
      },
    ];

    const dto = new GetListWordResultDto(list);

    expect(dto.value).toEqual({
      list: [
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
          text: "赤い手帳",
          page: 12,
          updatedAt: "2026-10-01T00:00:00.000Z",
        },
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVT1",
          text: "青い封筒",
          page: null,
          updatedAt: "2026-10-02T00:00:00.000Z",
        },
      ],
    });
  });
});
