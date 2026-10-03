import { describe, it, expect } from "vitest";
import { GetListBookResultDto } from "../../../../src/application/book/dto";
import { BookId } from "../../../../src/domain/book";
import type { BookListItem } from "../../../../src/domain/book";

describe("GetListBookResultDto", () => {
  it("一覧・全件数・総ページ数からDTOを生成できること", () => {
    const list: BookListItem[] = [
      {
        id: BookId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
        title: "テスト書籍",
        updatedAt: "2026-10-01T00:00:00.000Z",
        readingStatus: "finished",
        readingStatusLabel: "読了",
        workCount: 1,
        icon: null,
      },
    ];

    const dto = new GetListBookResultDto(list, 31, 2);

    expect(dto.value).toEqual({
      list: [
        {
          id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
          title: "テスト書籍",
          updatedAt: "2026-10-01T00:00:00.000Z",
          readingStatus: "finished",
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
