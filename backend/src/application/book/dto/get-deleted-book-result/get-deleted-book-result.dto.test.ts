import { describe, it, expect } from "vitest";
import { GetDeletedBookResultDto } from "..";
import type { AuthorItem, DeletedBookItem, DeletedBookWorkItem } from "../../../../domain";

describe("GetDeletedBookResultDto", () => {
  it("書籍情報・作品一覧・著者一覧からDTOを生成でき、作品を受け取った順のまま返すこと", () => {
    const book: DeletedBookItem = {
      id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
      title: "テスト書籍",
      publishedDate: "2026-01-01",
      readingStatusId: 3,
      readingStatusLabel: "読了",
      currentPage: 120,
      memo: "メモ",
      icon: null,
      updatedAt: "2026-10-01T00:00:00.000Z",
    };
    const works: DeletedBookWorkItem[] = [
      { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品B", memo: "作品メモ", icon: null },
      { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品A", memo: null, icon: "📘" },
    ];
    const authors: AuthorItem[] = [{ name: "著者A" }];

    const dto = new GetDeletedBookResultDto(book, works, authors);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
      title: "テスト書籍",
      publishedDate: "2026-01-01",
      readingStatusId: 3,
      readingStatusLabel: "読了",
      currentPage: 120,
      memo: "メモ",
      icon: null,
      updatedAt: "2026-10-01T00:00:00.000Z",
      // 作品は受け取った順のまま返す（並びは Repository が決める）
      works: [
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品B", memo: "作品メモ", icon: null },
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品A", memo: null, icon: "📘" },
      ],
      authors: [{ name: "著者A" }],
    });
  });
});
