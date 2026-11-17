import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BookAggregate, BookId, BookMemo, BookTitle, CurrentPage, IconId, PublishedDate, ReadingStatusId, Timestamp, UserId, WorkEntity, WorkId, WorkMemo, WorkSort, WorkTitle, type IDeleteBookRepository } from "../../../../domain";
import { DeleteBookUsecase } from "./delete-book.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAX";

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";
/** 作品の取得時点の更新日時（書籍と区別するため別の値にする） */
const WORK_UPDATED_AT = "2025-12-01T00:00:00.000Z";
/** 実行時の現在日時（削除後の書籍の更新日時になる） */
const NOW = "2026-01-02T00:00:00.000Z";

const BODY = {
  updatedAt: BOOK_UPDATED_AT,
};

/**
 * 削除前の書籍集約（削除されていない作品1件を持つ）
 */
function createBook(): BookAggregate {
  return BookAggregate.reconstruct({
    id: BookId.of(BOOK_ID),
    userId: USER_ID,
    title: BookTitle.of("短編集"),
    publishedDate: PublishedDate.of(null),
    readingStatusId: ReadingStatusId.initial(),
    currentPage: CurrentPage.of(null),
    memo: BookMemo.of(null),
    iconId: IconId.of(1),
    deleteFlg: false,
    works: [
      WorkEntity.reconstruct({ id: WorkId.of(WORK_ID), title: WorkTitle.of("作品1"), sort: WorkSort.of(1), memo: WorkMemo.of(null), iconId: IconId.of(1), deleteFlg: false, updatedAt: Timestamp.of(WORK_UPDATED_AT) }),
    ],
    updatedAt: Timestamp.of(BOOK_UPDATED_AT),
  });
}

type Options = {
  book?: BookAggregate | null;
  saved?: boolean;
};

function createUsecase({ book = createBook(), saved = true }: Options = {}) {
  const deleteBookRepository = {
    findBook: vi.fn<IDeleteBookRepository["findBook"]>().mockResolvedValue(book),
    deleteBook: vi.fn<IDeleteBookRepository["deleteBook"]>().mockResolvedValue(saved),
  } satisfies IDeleteBookRepository;

  const usecase = new DeleteBookUsecase(deleteBookRepository);

  return { usecase, deleteBookRepository };
}

describe("DeleteBookUsecase", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("書籍を削除済み・現在日時を更新日時にして1回保存し、ok を返すこと（作品は変更しない）", async () => {
    const { usecase, deleteBookRepository } = createUsecase();
    const before = createBook().toSnapshot();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result.isOk()).toBe(true);
    expect(deleteBookRepository.deleteBook).toHaveBeenCalledTimes(1);
    const [savedBook, expectedUpdatedAt] = deleteBookRepository.deleteBook.mock.calls[0] ?? [];
    // 保存時の排他の条件には、画面の表示時点の更新日時を使う
    expect(expectedUpdatedAt?.value).toBe(BOOK_UPDATED_AT);
    expect(savedBook?.toSnapshot()).toEqual({ ...before, deleteFlg: true, updatedAt: NOW });
  });

  it("指定したユーザー・書籍IDで削除対象を取得すること", async () => {
    const { usecase, deleteBookRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(deleteBookRepository.findBook).toHaveBeenCalledWith(USER_ID, BookId.of(BOOK_ID));
  });

  it("削除対象の書籍が存在しない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, deleteBookRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(deleteBookRepository.deleteBook).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_BOOK を返し、保存しないこと", async () => {
    const { usecase, deleteBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(deleteBookRepository.deleteBook).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で更新されていたため保存されなかった場合、CONFLICT_BOOK を返すこと", async () => {
    const { usecase, deleteBookRepository } = createUsecase({ saved: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(deleteBookRepository.deleteBook).toHaveBeenCalledTimes(1);
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反を項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, deleteBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { updatedAt: "2026-01-01" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "updatedAt", error: { type: "TIMESTAMP_INVALID" } },
      ],
    });
    expect(deleteBookRepository.findBook).not.toHaveBeenCalled();
    expect(deleteBookRepository.deleteBook).not.toHaveBeenCalled();
  });

  it("書籍IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, deleteBookRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, bookId: "", body: BODY })).rejects.toThrow();
    expect(deleteBookRepository.findBook).not.toHaveBeenCalled();
  });
});
