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
  it("create で作成した集約のスナップショットが、渡した値と初期値を返すこと（自動作成する作品は書籍のタイトル・アイコンを引き継ぐ）", () => {
    const book = BookAggregate.create({
      userId: UserId.of(USER_ID),
      title: BookTitle.of("容疑者Xの献身"),
      publishedDate: PublishedDate.of("2005-08"),
      currentPage: CurrentPage.of(120),
      memo: BookMemo.of("メモ"),
      iconId: IconId.of(2),
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
          iconId: 2,
          deleteFlg: false,
        },
      ],
    });
  });

  it("未入力の項目はスナップショットで null になること", () => {
    const book = BookAggregate.create({
      userId: UserId.of(USER_ID),
      title: BookTitle.of("容疑者Xの献身"),
      publishedDate: PublishedDate.of(null),
      currentPage: CurrentPage.of(null),
      memo: BookMemo.of(null),
      iconId: IconId.of(1),
    });

    const snapshot = book.toSnapshot();

    expect(snapshot.publishedDate).toBeNull();
    expect(snapshot.currentPage).toBeNull();
    expect(snapshot.memo).toBeNull();
  });

  it("書籍IDと自動作成する作品のIDが異なること", () => {
    const book = BookAggregate.create({
      userId: UserId.of(USER_ID),
      title: BookTitle.of("容疑者Xの献身"),
      publishedDate: PublishedDate.of(null),
      currentPage: CurrentPage.of(null),
      memo: BookMemo.of(null),
      iconId: IconId.of(1),
    });

    const snapshot = book.toSnapshot();

    expect(snapshot.works[0]?.id).not.toBe(snapshot.id);
  });

  it("reconstruct で復元した集約のスナップショットが、渡した値をそのまま返すこと", () => {
    const book = BookAggregate.reconstruct({
      id: BookId.of(BOOK_ID),
      userId: UserId.of(USER_ID),
      title: BookTitle.of("短編集"),
      publishedDate: PublishedDate.of("2005-08"),
      readingStatusId: ReadingStatusId.of(2),
      currentPage: CurrentPage.of(120),
      memo: BookMemo.of("メモ"),
      iconId: IconId.of(2),
      deleteFlg: true,
      works: [
        WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_1), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of("作品メモ"), iconId: IconId.of(4), deleteFlg: false }),
        WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_2), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of(null), iconId: IconId.of(5), deleteFlg: true }),
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
        { id: WORK_ID_1, title: "作品1", sort: 1, memo: "作品メモ", iconId: 4, deleteFlg: false },
        { id: WORK_ID_2, title: "作品2", sort: 2, memo: null, iconId: 5, deleteFlg: true },
      ],
    });
  });

  /** 作品1（未削除）・作品2（未削除）を持つ書籍集約 */
  function createBook(deleteFlg = false): BookAggregate {
    return BookAggregate.reconstruct({
      id: BookId.of(BOOK_ID),
      userId: UserId.of(USER_ID),
      title: BookTitle.of("短編集"),
      publishedDate: PublishedDate.of(null),
      readingStatusId: ReadingStatusId.of(1),
      currentPage: CurrentPage.of(null),
      memo: BookMemo.of(null),
      iconId: IconId.of(1),
      deleteFlg,
      works: [
        WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_1), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
        WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_2), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
      ],
    });
  }

  describe("delete", () => {
    it("自身を削除済みにすること", () => {
      const book = createBook();
      const before = book.toSnapshot();

      book.delete();

      expect(book.toSnapshot()).toEqual({ ...before, deleteFlg: true });
    });

    it("既に削除済みの場合は throw すること", () => {
      const book = createBook(true);

      expect(() => book.delete()).toThrow();
    });
  });

  describe("restore", () => {
    it("自身の削除済みを解除すること", () => {
      const book = createBook(true);
      const before = book.toSnapshot();

      book.restore();

      expect(book.toSnapshot()).toEqual({ ...before, deleteFlg: false });
    });

    it("削除されていない場合は throw すること", () => {
      const book = createBook();

      expect(() => book.restore()).toThrow();
    });
  });

  describe("update", () => {
    const WORK_ID_3 = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

    function workParam(id: string | null, title: string, sort: number, deleteFlg = false, iconId = 1) {
      return {
        id: id ? WorkId.of(id) : null,
        title: WorkTitle.of(title),
        memo: WorkMemo.of(null),
        sort: WorkSort.of(sort),
        iconId: IconId.of(iconId),
        deleteFlg,
      };
    }

    /** 書籍情報を固定値で更新するパラメータ（作品一覧のみ指定する） */
    function updateParam(works: ReturnType<typeof workParam>[]) {
      return {
        title: BookTitle.of("短編集改"),
        publishedDate: PublishedDate.of("2005-08"),
        readingStatus: ReadingStatusId.of(2),
        currentPage: CurrentPage.of(120),
        memo: BookMemo.of("メモ"),
        iconId: IconId.of(3),
        works,
      };
    }

    it("自身の書籍情報と作品（既存作品の更新・削除、新規作品の追加）を置き換え、新規作品には ID が採番されること", () => {
      const book = createBook();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1改", 2, false, 4),
        workParam(WORK_ID_2, "作品2", 1, true),
        workParam(null, "作品3", 1, false, 6),
      ]));

      expect(result.isOk()).toBe(true);
      expect(book.toSnapshot()).toEqual({
        id: BOOK_ID,
        userId: USER_ID,
        title: "短編集改",
        publishedDate: "2005-08",
        readingStatusId: 2,
        currentPage: 120,
        memo: "メモ",
        iconId: 3,
        deleteFlg: false,
        works: [
          { id: WORK_ID_1, title: "作品1改", sort: 2, memo: null, iconId: 4, deleteFlg: false },
          { id: WORK_ID_2, title: "作品2", sort: 1, memo: null, iconId: 1, deleteFlg: true },
          { id: expect.stringMatching(ULID_PATTERN), title: "作品3", sort: 1, memo: null, iconId: 6, deleteFlg: false },
        ],
      });
    });

    it("削除済みの作品とはタイトル・表示順が重複してもよいこと", () => {
      const book = createBook();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1, true),
        workParam(WORK_ID_2, "作品2", 2),
        workParam(null, "作品1", 1),
      ]));

      expect(result.isOk()).toBe(true);
    });

    it("削除済みの書籍の場合は throw すること", () => {
      const book = createBook(true);

      expect(() => book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品2", 2),
      ]))).toThrow();
    });

    it("既存の作品が含まれていない場合は WORKS_MISMATCH を返し、自身を変更しないこと", () => {
      const book = createBook();
      const before = book.toSnapshot();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
      expect(book.toSnapshot()).toEqual(before);
    });

    it("既存にない作品 ID が含まれる場合は WORKS_MISMATCH を返すこと", () => {
      const book = createBook();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品2", 2),
        workParam(WORK_ID_3, "作品3", 3),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
    });

    it("作品の不一致と不変条件の違反が両方ある場合は WORKS_MISMATCH を返すこと", () => {
      const book = createBook();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1, true),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
    });

    it("同じ作品 ID が重複して含まれる場合は DUPLICATE_WORK_ID を返し、自身を変更しないこと（作品の不一致より優先する）", () => {
      const book = createBook();
      const before = book.toSnapshot();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品2", 2),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_WORKS", errors: [{ type: "DUPLICATE_WORK_ID", id: WORK_ID_1 }] });
      expect(book.toSnapshot()).toEqual(before);
    });

    it("新規の作品が削除済みの場合は NEW_WORK_DELETED を返すこと", () => {
      const book = createBook();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品2", 2),
        workParam(null, "作品3", 3, true),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_WORKS", errors: [{ type: "NEW_WORK_DELETED" }] });
    });

    it("作品 ID の重複と新規作品の削除済み指定が両方ある場合はすべて返すこと", () => {
      const book = createBook();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_1, "作品1", 1),
        workParam(null, "作品3", 3, true),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({
        type: "INVALID_WORKS",
        errors: [{ type: "DUPLICATE_WORK_ID", id: WORK_ID_1 }, { type: "NEW_WORK_DELETED" }],
      });
    });

    it("削除されていない作品が0件の場合は ALL_DELETED を返すこと", () => {
      const book = createBook();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1, true),
        workParam(WORK_ID_2, "作品2", 2, true),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_WORKS", errors: [{ type: "ALL_DELETED" }] });
    });

    it("削除されていない作品のタイトル・表示順の重複をすべて返し、自身を変更しないこと", () => {
      const book = createBook();
      const before = book.toSnapshot();

      const result = book.update(updateParam([
        workParam(WORK_ID_1, "作品1", 1),
        workParam(WORK_ID_2, "作品1", 1),
      ]));

      expect(result._unsafeUnwrapErr()).toEqual({
        type: "INVALID_WORKS",
        errors: [
          { type: "DUPLICATE_WORK_TITLE", title: "作品1" },
          { type: "DUPLICATE_WORK_SORT", sort: 1 },
        ],
      });
      expect(book.toSnapshot()).toEqual(before);
    });

    describe("既に削除済みの作品がある場合", () => {
      const DELETED_WORK_SNAPSHOT = { id: WORK_ID_3, title: "作品3", sort: 3, memo: null, iconId: 1, deleteFlg: true };

      /** 作品1（未削除）・作品2（未削除）・作品3（削除済み）を持つ書籍集約 */
      function createBookWithDeletedWork(): BookAggregate {
        return BookAggregate.reconstruct({
          id: BookId.of(BOOK_ID),
          userId: UserId.of(USER_ID),
          title: BookTitle.of("短編集"),
          publishedDate: PublishedDate.of(null),
          readingStatusId: ReadingStatusId.of(1),
          currentPage: CurrentPage.of(null),
          memo: BookMemo.of(null),
          iconId: IconId.of(1),
          deleteFlg: false,
          works: [
            WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_1), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
            WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_2), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
            WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_3), title: WorkTitle.of("作品3"), sort: WorkSort.of(3), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: true }),
          ],
        });
      }

      it("削除済みの作品を未削除として値を変えて送っても、その作品は変更せず、書籍情報と他の作品の変更は反映すること", () => {
        const book = createBookWithDeletedWork();

        const result = book.update(updateParam([
          workParam(WORK_ID_1, "作品1改", 1),
          workParam(WORK_ID_2, "作品2", 2),
          workParam(WORK_ID_3, "作品3改", 4, false, 5),
        ]));

        expect(result.isOk()).toBe(true);
        const snapshot = book.toSnapshot();
        expect(snapshot.title).toBe("短編集改");
        expect(snapshot.works).toHaveLength(3);
        expect(snapshot.works).toEqual(expect.arrayContaining([
          { id: WORK_ID_1, title: "作品1改", sort: 1, memo: null, iconId: 1, deleteFlg: false },
          { id: WORK_ID_2, title: "作品2", sort: 2, memo: null, iconId: 1, deleteFlg: false },
          DELETED_WORK_SNAPSHOT,
        ]));
      });

      it("削除済みの作品を削除済みとして値を変えて送っても、その作品は変更しないこと", () => {
        const book = createBookWithDeletedWork();

        const result = book.update(updateParam([
          workParam(WORK_ID_1, "作品1", 1),
          workParam(WORK_ID_2, "作品2", 2),
          workParam(WORK_ID_3, "作品3改", 4, true, 5),
        ]));

        expect(result.isOk()).toBe(true);
        expect(book.toSnapshot().works).toContainEqual(DELETED_WORK_SNAPSHOT);
      });

      it("削除済みの作品を含めずに送っても成功し、その作品を変更せずに保持すること", () => {
        const book = createBookWithDeletedWork();

        const result = book.update(updateParam([
          workParam(WORK_ID_1, "作品1", 1),
          workParam(WORK_ID_2, "作品2", 2),
        ]));

        expect(result.isOk()).toBe(true);
        const works = book.toSnapshot().works;
        expect(works).toHaveLength(3);
        expect(works).toEqual(expect.arrayContaining([
          { id: WORK_ID_1, title: "作品1", sort: 1, memo: null, iconId: 1, deleteFlg: false },
          { id: WORK_ID_2, title: "作品2", sort: 2, memo: null, iconId: 1, deleteFlg: false },
          DELETED_WORK_SNAPSHOT,
        ]));
      });

      it("既存にない作品 ID を削除済みとして送った場合は WORKS_MISMATCH を返すこと", () => {
        const book = createBookWithDeletedWork();
        const before = book.toSnapshot();

        const result = book.update(updateParam([
          workParam(WORK_ID_1, "作品1", 1),
          workParam(WORK_ID_2, "作品2", 2),
          workParam("01ARZ3NDEKTSV4RRFFQ69G5FB0", "作品4", 4, true),
        ]));

        expect(result._unsafeUnwrapErr()).toEqual({ type: "WORKS_MISMATCH" });
        expect(book.toSnapshot()).toEqual(before);
      });

      it("削除済みの作品を未削除として送っても、その作品とタイトル・表示順が重複する作品があってよいこと", () => {
        const book = createBookWithDeletedWork();

        const result = book.update(updateParam([
          workParam(WORK_ID_1, "作品3", 3),
          workParam(WORK_ID_2, "作品2", 2),
          workParam(WORK_ID_3, "作品3", 3),
        ]));

        expect(result.isOk()).toBe(true);
      });

      it("削除済みの作品を未削除として送り、他の作品をすべて削除する場合は ALL_DELETED を返し、自身を変更しないこと", () => {
        const book = createBookWithDeletedWork();
        const before = book.toSnapshot();

        const result = book.update(updateParam([
          workParam(WORK_ID_1, "作品1", 1, true),
          workParam(WORK_ID_2, "作品2", 2, true),
          workParam(WORK_ID_3, "作品3", 3),
        ]));

        expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_WORKS", errors: [{ type: "ALL_DELETED" }] });
        expect(book.toSnapshot()).toEqual(before);
      });
    });
  });

  describe("updateWork", () => {
    const WORK_ID_3 = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

    /** 作品1（未削除）・作品2（未削除）・作品3（削除済み）を持つ書籍集約 */
    function createBookWithDeletedWork(): BookAggregate {
      return BookAggregate.reconstruct({
        id: BookId.of(BOOK_ID),
        userId: UserId.of(USER_ID),
        title: BookTitle.of("短編集"),
        publishedDate: PublishedDate.of(null),
        readingStatusId: ReadingStatusId.of(1),
        currentPage: CurrentPage.of(null),
        memo: BookMemo.of(null),
        iconId: IconId.of(1),
        deleteFlg: false,
        works: [
          WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_1), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
          WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_2), title: WorkTitle.of("作品2"), sort: WorkSort.of(2), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false }),
          WorkEntity.reconstruct({ id: WorkId.of(WORK_ID_3), title: WorkTitle.of("作品3"), sort: WorkSort.of(3), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: true }),
        ],
      });
    }

    function updateWorkParam(id: string, title: string, memo: string | null = "作品メモ", iconId = 4) {
      return {
        id: WorkId.of(id),
        title: WorkTitle.of(title),
        memo: WorkMemo.of(memo),
        iconId: IconId.of(iconId),
      };
    }

    it("自身の対象の作品の作品名・メモ・アイコンだけを置き換え、表示順・削除フラグ・他の作品・書籍情報は変更しないこと", () => {
      const book = createBookWithDeletedWork();
      const before = book.toSnapshot();

      const result = book.updateWork(updateWorkParam(WORK_ID_2, "作品2改"));

      expect(result.isOk()).toBe(true);
      expect(book.toSnapshot()).toEqual({
        ...before,
        works: [
          { id: WORK_ID_1, title: "作品1", sort: 1, memo: null, iconId: 1, deleteFlg: false },
          { id: WORK_ID_2, title: "作品2改", sort: 2, memo: "作品メモ", iconId: 4, deleteFlg: false },
          { id: WORK_ID_3, title: "作品3", sort: 3, memo: null, iconId: 1, deleteFlg: true },
        ],
      });
    });

    it("作品名を変えずに更新できること（自身の作品名とは重複扱いしない）", () => {
      const book = createBookWithDeletedWork();

      const result = book.updateWork(updateWorkParam(WORK_ID_1, "作品1"));

      expect(result.isOk()).toBe(true);
    });

    it("削除済みの作品とは作品名が重複してもよいこと", () => {
      const book = createBookWithDeletedWork();

      const result = book.updateWork(updateWorkParam(WORK_ID_1, "作品3"));

      expect(result.isOk()).toBe(true);
    });

    it("削除済みの書籍の場合は throw すること", () => {
      const book = createBook(true);

      expect(() => book.updateWork(updateWorkParam(WORK_ID_1, "作品1改"))).toThrow();
    });

    it("書籍に存在しない作品の場合は WORK_NOT_FOUND を返すこと", () => {
      const book = createBook();

      const result = book.updateWork(updateWorkParam(WORK_ID_3, "作品3改"));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "WORK_NOT_FOUND" });
    });

    it("削除済みの作品の場合は WORK_NOT_FOUND を返すこと", () => {
      const book = createBookWithDeletedWork();

      const result = book.updateWork(updateWorkParam(WORK_ID_3, "作品3改"));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "WORK_NOT_FOUND" });
    });

    it("削除されていない他の作品と作品名が重複する場合は DUPLICATE_WORK_TITLE を返し、自身を変更しないこと", () => {
      const book = createBookWithDeletedWork();
      const before = book.toSnapshot();

      const result = book.updateWork(updateWorkParam(WORK_ID_1, "作品2"));

      expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_WORK_TITLE", title: "作品2" });
      expect(book.toSnapshot()).toEqual(before);
    });
  });
});
