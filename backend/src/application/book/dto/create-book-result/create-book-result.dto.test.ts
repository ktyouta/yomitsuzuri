import { describe, it, expect } from "vitest";
import { CreateBookResultDto } from "..";
import { BookAggregate, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

describe("CreateBookResultDto", () => {
  it("書籍集約から、ユーザーID・削除フラグを除いた書籍の項目と作品一覧を写像すること", () => {
    const book = BookAggregate.generate({
      userId: UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
      title: new BookTitle("容疑者Xの献身"),
      publishedDate: new PublishedDate("2005-08"),
      currentPage: new CurrentPage(120),
      memo: new BookMemo("メモ"),
      iconId: new IconId(2),
    });
    const snapshot = book.toSnapshot();

    const dto = new CreateBookResultDto(book);

    expect(dto.value).toEqual({
      id: snapshot.id,
      title: "容疑者Xの献身",
      publishedDate: "2005-08",
      readingStatusId: 1,
      currentPage: 120,
      memo: "メモ",
      icon: 2,
      works: [
        {
          id: snapshot.works[0]?.id,
          title: "容疑者Xの献身",
          sort: 1,
          memo: null,
        },
      ],
    });
  });
});
