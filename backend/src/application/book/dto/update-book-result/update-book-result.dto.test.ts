import { describe, expect, it } from "vitest";
import { UpdateBookResultDto } from "..";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

describe("UpdateBookResultDto", () => {
  it("書籍集約から、userId・削除フラグを除いた項目と削除されていない作品だけでDTOを生成できること", () => {
    const book = BookAggregate.reconstruct({
      id: BookId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
      userId: UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
      title: BookTitle.of("テスト書籍"),
      publishedDate: PublishedDate.of("2026-10"),
      readingStatusId: ReadingStatusId.of(2),
      currentPage: CurrentPage.of(120),
      memo: BookMemo.of("書籍メモ"),
      iconId: IconId.of(3),
      deleteFlg: false,
      works: [
        new WorkEntity(WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS0"), WorkTitle.of("作品1"), WorkSort.of(1), WorkMemo.of(null), false),
        new WorkEntity(WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS1"), WorkTitle.of("作品2"), WorkSort.of(2), WorkMemo.of("作品メモ"), false),
        new WorkEntity(WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS2"), WorkTitle.of("削除済み作品"), WorkSort.of(3), WorkMemo.of(null), true),
      ],
    });

    const dto = new UpdateBookResultDto(book);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
      title: "テスト書籍",
      publishedDate: "2026-10",
      readingStatusId: 2,
      currentPage: 120,
      memo: "書籍メモ",
      iconId: 3,
      works: [
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品1", sort: 1, memo: null },
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品2", sort: 2, memo: "作品メモ" },
      ],
    });
  });
});
