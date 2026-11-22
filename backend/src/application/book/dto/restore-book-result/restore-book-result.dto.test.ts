import { describe, expect, it } from "vitest";
import { RestoreBookResultDto } from "..";
import { AuthorEntity, AuthorId, AuthorName, AuthorSortOrder, BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle } from "../../../../domain";

describe("RestoreBookResultDto", () => {
  it("書籍集約から、書籍の userId・削除フラグを除いた項目（更新日時を含む）と、作品（削除フラグ付き）と、著者一覧（表示順）でDTOを生成できること", () => {
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
        WorkEntity.reconstruct({ id: WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS0"), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(4), deleteFlg: false, updatedAt: Timestamp.of("2026-01-02T00:00:00.000Z") }),
        WorkEntity.reconstruct({ id: WorkId.of("01BX5ZZKBKACTAV9WEVGEMMVS1"), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of("作品メモ"), iconId: IconId.of(5), deleteFlg: false, updatedAt: Timestamp.of("2026-01-02T00:00:00.000Z") }),
      ],
      updatedAt: Timestamp.of("2026-01-02T00:00:00.000Z"),
      authors: [
        AuthorEntity.reconstruct({ id: AuthorId.of("01BX5ZZKBKACTAV9WEVGEMMVT0"), name: AuthorName.of("著者A"), sortOrder: AuthorSortOrder.of(1), deleteFlg: false }),
        AuthorEntity.reconstruct({ id: AuthorId.of("01BX5ZZKBKACTAV9WEVGEMMVT1"), name: AuthorName.of("著者B"), sortOrder: AuthorSortOrder.of(2), deleteFlg: false }),
      ],
    });

    const dto = new RestoreBookResultDto(book);

    expect(dto.value).toEqual({
      id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
      title: "テスト書籍",
      publishedDate: "2026-10",
      readingStatusId: 2,
      currentPage: 120,
      memo: "書籍メモ",
      iconId: 3,
      updatedAt: "2026-01-02T00:00:00.000Z",
      works: [
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "作品1", sort: 1, memo: null, iconId: 4, deleteFlg: false },
        { id: "01BX5ZZKBKACTAV9WEVGEMMVS1", title: "作品2", sort: 2, memo: "作品メモ", iconId: 5, deleteFlg: false },
      ],
      authors: [{ name: "著者A" }, { name: "著者B" }],
    });
  });
});
