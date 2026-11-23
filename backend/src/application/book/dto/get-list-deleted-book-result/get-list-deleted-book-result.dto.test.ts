import { describe, it, expect } from "vitest";
import { GetListDeletedBookResultDto } from "..";
import type { DeletedBookListItem } from "../../../../domain";

describe("GetListDeletedBookResultDto", () => {
  it("一覧・全件数・総ページ数からDTOを生成できること", () => {
    const list: DeletedBookListItem[] = [
      {
        id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
        title: "テスト書籍",
        updatedAt: "2026-10-01T00:00:00.000Z",
        readingStatusId: 3,
        readingStatusLabel: "読了",
        workCount: 1,
        icon: null,
      },
    ];

    const dto = new GetListDeletedBookResultDto(list, 31, 2);

    expect(dto.value).toEqual({
      list: [
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
          title: "テスト書籍",
          updatedAt: "2026-10-01T00:00:00.000Z",
          readingStatusId: 3,
          readingStatusLabel: "読了",
          workCount: 1,
          icon: null,
        },
      ],
      total: 31,
      totalPages: 2,
    });
  });
});
