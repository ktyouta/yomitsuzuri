import { describe, expect, it } from "vitest";
import { GetBookResultDto } from "..";
import type { BookItem, WorkItem } from "../../../../domain/book";

describe("GetBookResultDto", () => {
  it("書籍情報・作品一覧からDTOを生成できること", () => {
    const book: BookItem = {
      id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
      title: "テスト書籍",
      publishedDate: "2026-10",
      readingStatusId: 2,
      readingStatusLabel: "読書中",
      currentPage: 120,
      memo: "書籍メモ",
      iconId: 3,
      icon: "📕",
      updatedAt: "2026-10-01T00:00:00.000Z",
    };
    const works: WorkItem[] = [
      { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品1", sort: 1, memo: null },
      { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品2", sort: 2, memo: "作品メモ" },
    ];

    const dto = new GetBookResultDto(book, works);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
      title: "テスト書籍",
      publishedDate: "2026-10",
      readingStatusId: 2,
      readingStatusLabel: "読書中",
      currentPage: 120,
      memo: "書籍メモ",
      iconId: 3,
      icon: "📕",
      updatedAt: "2026-10-01T00:00:00.000Z",
      works: [
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品1", sort: 1, memo: null },
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品2", sort: 2, memo: "作品メモ" },
      ],
    });
  });
});
