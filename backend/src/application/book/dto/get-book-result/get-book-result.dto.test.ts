import { describe, expect, it } from "vitest";
import { GetBookResultDto } from "..";
import type { AuthorItem, BookItem, WorkItem } from "../../../../domain";

describe("GetBookResultDto", () => {
  it("書籍情報・作品一覧（削除済みの作品を含む）・著者一覧からDTOを生成できること", () => {
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
      { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品1", sort: 1, memo: null, iconId: 4, icon: "📗", deleteFlg: false },
      { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品2", sort: 2, memo: "作品メモ", iconId: 5, icon: null, deleteFlg: true },
    ];

    const authors: AuthorItem[] = [{ name: "著者A" }, { name: "著者B" }];

    const dto = new GetBookResultDto(book, works, authors);

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
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品1", sort: 1, memo: null, iconId: 4, icon: "📗", deleteFlg: false },
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品2", sort: 2, memo: "作品メモ", iconId: 5, icon: null, deleteFlg: true },
      ],
      authors: [{ name: "著者A" }, { name: "著者B" }],
    });
  });
});
