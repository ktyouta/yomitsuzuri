import { describe, it, expect } from "vitest";
import { BookAggregate } from "..";
import { BookMemo, BookTitle, CurrentPage, IconId, PublishedDate } from "../../value-object";
import { UserId } from "../../../shared";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

describe("BookAggregate", () => {
  it("generate で作成した集約のスナップショットが、渡した値と初期値を返すこと", () => {
    const book = BookAggregate.generate({
      userId: UserId.of(USER_ID),
      title: new BookTitle("容疑者Xの献身"),
      publishedDate: new PublishedDate("2005-08"),
      currentPage: new CurrentPage(120),
      memo: new BookMemo("メモ"),
      iconId: new IconId(2),
    });

    const snapshot = book.toSnapshot();

    expect(snapshot).toEqual({
      id: expect.stringMatching(ULID_PATTERN),
      userId: USER_ID,
      title: "容疑者Xの献身",
      publishedDate: "2005-08",
      readingStatusId: 1,
      currentPage: 120,
      memo: "メモ",
      iconId: 2,
      deleteFlg: false,
      works: [
        {
          id: expect.stringMatching(ULID_PATTERN),
          title: "容疑者Xの献身",
          sort: 1,
          memo: null,
        },
      ],
    });
  });

  it("未入力の項目はスナップショットで null になること", () => {
    const book = BookAggregate.generate({
      userId: UserId.of(USER_ID),
      title: new BookTitle("容疑者Xの献身"),
      publishedDate: new PublishedDate(null),
      currentPage: new CurrentPage(null),
      memo: new BookMemo(null),
      iconId: new IconId(1),
    });

    const snapshot = book.toSnapshot();

    expect(snapshot.publishedDate).toBeNull();
    expect(snapshot.currentPage).toBeNull();
    expect(snapshot.memo).toBeNull();
  });

  it("書籍IDと自動作成する作品のIDが異なること", () => {
    const book = BookAggregate.generate({
      userId: UserId.of(USER_ID),
      title: new BookTitle("容疑者Xの献身"),
      publishedDate: new PublishedDate(null),
      currentPage: new CurrentPage(null),
      memo: new BookMemo(null),
      iconId: new IconId(1),
    });

    const snapshot = book.toSnapshot();

    expect(snapshot.works[0]?.id).not.toBe(snapshot.id);
  });
});
