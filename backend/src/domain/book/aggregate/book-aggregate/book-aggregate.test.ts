import { describe, it, expect } from "vitest";
import { BookAggregate } from "..";
import { WorkEntity } from "../../entity";
import { BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, WorkId, WorkMemo, WorkSort, WorkTitle } from "../../value-object";
import { UserId } from "../../../shared";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";
const BOOK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const WORK_ID_1 = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const WORK_ID_2 = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
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

  it("reconstruct で復元した集約のスナップショットが、渡した値をそのまま返すこと", () => {
    const book = BookAggregate.reconstruct({
      id: BookId.of(BOOK_ID),
      userId: UserId.of(USER_ID),
      title: new BookTitle("短編集"),
      publishedDate: new PublishedDate("2005-08"),
      readingStatusId: ReadingStatusId.of(2),
      currentPage: new CurrentPage(120),
      memo: new BookMemo("メモ"),
      iconId: new IconId(2),
      deleteFlg: true,
      works: [
        new WorkEntity(WorkId.of(WORK_ID_1), new WorkTitle("作品1"), WorkSort.of(1), new WorkMemo("作品メモ")),
        new WorkEntity(WorkId.of(WORK_ID_2), new WorkTitle("作品2"), WorkSort.of(2), new WorkMemo(null)),
      ],
    });

    const snapshot = book.toSnapshot();

    expect(snapshot).toEqual({
      id: BOOK_ID,
      userId: USER_ID,
      title: "短編集",
      publishedDate: "2005-08",
      readingStatusId: 2,
      currentPage: 120,
      memo: "メモ",
      iconId: 2,
      deleteFlg: true,
      works: [
        { id: WORK_ID_1, title: "作品1", sort: 1, memo: "作品メモ" },
        { id: WORK_ID_2, title: "作品2", sort: 2, memo: null },
      ],
    });
  });
});
