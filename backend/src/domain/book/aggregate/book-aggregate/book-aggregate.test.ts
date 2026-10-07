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
          deleteFlg: false,
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
        new WorkEntity(WorkId.of(WORK_ID_1), new WorkTitle("作品1"), WorkSort.of(1), new WorkMemo("作品メモ"), false),
        new WorkEntity(WorkId.of(WORK_ID_2), new WorkTitle("作品2"), WorkSort.of(2), new WorkMemo(null), true),
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
        { id: WORK_ID_1, title: "作品1", sort: 1, memo: "作品メモ", deleteFlg: false },
        { id: WORK_ID_2, title: "作品2", sort: 2, memo: null, deleteFlg: true },
      ],
    });
  });

  /** 作品1（未削除）・作品2（未削除）を持つ書籍集約 */
  function createBook(deleteFlg = false): BookAggregate {
    return BookAggregate.reconstruct({
      id: BookId.of(BOOK_ID),
      userId: UserId.of(USER_ID),
      title: new BookTitle("短編集"),
      publishedDate: new PublishedDate(null),
      readingStatusId: ReadingStatusId.of(1),
      currentPage: new CurrentPage(null),
      memo: new BookMemo(null),
      iconId: new IconId(1),
      deleteFlg,
      works: [
        new WorkEntity(WorkId.of(WORK_ID_1), new WorkTitle("作品1"), WorkSort.of(1), new WorkMemo(null), false),
        new WorkEntity(WorkId.of(WORK_ID_2), new WorkTitle("作品2"), WorkSort.of(2), new WorkMemo(null), false),
      ],
    });
  }

  describe("delete", () => {
    it("削除済みにした集約を返し、自身は変更しないこと", () => {
      const book = createBook();
      const before = book.toSnapshot();

      const deleted = book.delete();

      expect(deleted.toSnapshot()).toEqual({ ...before, deleteFlg: true });
      expect(book.toSnapshot()).toEqual(before);
    });

    it("既に削除済みの場合は throw すること", () => {
      const book = createBook(true);

      expect(() => book.delete()).toThrow();
    });
  });

  describe("restore", () => {
    it("削除済みを解除した集約を返し、自身は変更しないこと", () => {
      const book = createBook(true);
      const before = book.toSnapshot();

      const restored = book.restore();

      expect(restored.toSnapshot()).toEqual({ ...before, deleteFlg: false });
      expect(book.toSnapshot()).toEqual(before);
    });

    it("削除されていない場合は throw すること", () => {
      const book = createBook();

      expect(() => book.restore()).toThrow();
    });
  });

  describe("updateWork", () => {
    const WORK_ID_3 = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

    function workParam(id: string | null, title: string, sort: number, deleteFlg = false) {
      return {
        id: id ? WorkId.of(id) : null,
        title: new WorkTitle(title),
        memo: new WorkMemo(null),
        sort: WorkSort.of(sort),
        deleteFlg,
      };
    }

    it("既存作品の更新・削除と新規作品の追加を反映した集約を返し、新規作品には ID が採番されること", () => {
      const book = createBook();
      const before = book.toSnapshot();

      const result = book.updateWork([
        workParam(WORK_ID_1, "作品1改", 2),
        workParam(WORK_ID_2, "作品2", 1, true),
        workParam(null, "作品3", 1),
      ]);

      expect(result._unsafeUnwrap().toSnapshot()).toEqual({
        ...before,
        works: [
          { id: WORK_ID_1, title: "作品1改", sort: 2, memo: null, deleteFlg: false },
          { id: WORK_ID_2, title: "作品2", sort: 1, memo: null, deleteFlg: true },
          { id: expect.stringMatching(ULID_PATTERN), title: "作品3", sort: 1, memo: null, deleteFlg: false },
        ],
      });
      expect(book.toSnapshot()).toEqual(before);
    });

    it("削除済みの作品とはタイトル・表示順が重複してもよいこと", () => {
      const book = createBook();

      const result = book.updateWork([
        workParam(WORK_ID_1, "作品1", 1, true),
        workParam(WORK_ID_2, "作品2", 2),
        workParam(null, "作品1", 1),
      ]);

      expect(result.isOk()).toBe(true);
    });

    it("削除済みの書籍の場合は throw すること", () => {
      const book = createBook(true);

      expect(() => book.updateWork([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品2", 2),
      ])).toThrow();
    });

    it("既存の作品が含まれていない場合は throw すること", () => {
      const book = createBook();

      expect(() => book.updateWork([
        workParam(WORK_ID_1, "作品1", 1),
      ])).toThrow();
    });

    it("既存にない作品 ID が含まれる場合は throw すること", () => {
      const book = createBook();

      expect(() => book.updateWork([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品2", 2),
        workParam(WORK_ID_3, "作品3", 3),
      ])).toThrow();
    });

    it("同じ作品 ID が重複して含まれる場合は throw すること", () => {
      const book = createBook();

      expect(() => book.updateWork([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_1, "作品1", 1),
      ])).toThrow();
    });

    it("新規の作品が削除済みの場合は throw すること", () => {
      const book = createBook();

      expect(() => book.updateWork([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品2", 2),
        workParam(null, "作品3", 3, true),
      ])).toThrow();
    });

    it("削除されていない作品が0件の場合は ALL_DELETED を返すこと", () => {
      const book = createBook();

      const result = book.updateWork([
        workParam(WORK_ID_1, "作品1", 1, true),
        workParam(WORK_ID_2, "作品2", 2, true),
      ]);

      expect(result._unsafeUnwrapErr()).toEqual([{ type: "ALL_DELETED" }]);
    });

    it("削除されていない作品のタイトル・表示順の重複をすべて返し、自身の作品を変更しないこと", () => {
      const book = createBook();
      const before = book.toSnapshot().works;

      const result = book.updateWork([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品1", 1),
      ]);

      expect(result._unsafeUnwrapErr()).toEqual([
        { type: "DUPLICATE_WORK_TITLE", title: "作品1" },
        { type: "DUPLICATE_WORK_SORT", sort: 1 },
      ]);
      expect(book.toSnapshot().works).toEqual(before);
    });
  });
});
