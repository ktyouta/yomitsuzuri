import { describe, expect, it, vi } from "vitest";
import { BookId, Timestamp, UserId, type IHardDeleteBookRepository } from "../../../../domain";
import { HardDeleteBookUsecase } from "./hard-delete-book.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";

/** 書籍の取得時点の更新日時 */
const BOOK_UPDATED_AT = "2026-01-01T00:00:00.000Z";

const BODY = {
  updatedAt: BOOK_UPDATED_AT,
};

type Options = {
  book?: { updatedAt: Timestamp } | null;
  deleted?: boolean;
};

function createUsecase({ book = { updatedAt: Timestamp.of(BOOK_UPDATED_AT) }, deleted = true }: Options = {}) {
  const hardDeleteBookRepository = {
    findBook: vi.fn<IHardDeleteBookRepository["findBook"]>().mockResolvedValue(book),
    deleteBook: vi.fn<IHardDeleteBookRepository["deleteBook"]>().mockResolvedValue(deleted),
  } satisfies IHardDeleteBookRepository;

  const usecase = new HardDeleteBookUsecase(hardDeleteBookRepository);

  return { usecase, hardDeleteBookRepository };
}

describe("HardDeleteBookUsecase", () => {
  it("指定した書籍を、画面の表示時点の更新日時を条件に1回物理削除し、ok を返すこと", async () => {
    const { usecase, hardDeleteBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result.isOk()).toBe(true);
    expect(hardDeleteBookRepository.deleteBook).toHaveBeenCalledTimes(1);
    const [bookId, expectedUpdatedAt] = hardDeleteBookRepository.deleteBook.mock.calls[0] ?? [];
    expect(bookId?.value).toBe(BOOK_ID);
    expect(expectedUpdatedAt?.value).toBe(BOOK_UPDATED_AT);
  });

  it("指定したユーザー・書籍IDで物理削除の対象を取得すること", async () => {
    const { usecase, hardDeleteBookRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(hardDeleteBookRepository.findBook).toHaveBeenCalledWith(USER_ID, BookId.of(BOOK_ID));
  });

  it("物理削除の対象の書籍が取得できない場合、NOT_FOUND を返し、削除しないこと", async () => {
    const { usecase, hardDeleteBookRepository } = createUsecase({ book: null });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(hardDeleteBookRepository.deleteBook).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_BOOK を返し、削除しないこと", async () => {
    const { usecase, hardDeleteBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(hardDeleteBookRepository.deleteBook).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で復元・更新されていたため削除されなかった場合、CONFLICT_BOOK を返すこと", async () => {
    const { usecase, hardDeleteBookRepository } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_BOOK" });
    expect(hardDeleteBookRepository.deleteBook).toHaveBeenCalledTimes(1);
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反を項目名とともに返し、DB を問い合わせず削除しないこと", async () => {
    const { usecase, hardDeleteBookRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID, body: { updatedAt: "2026-01-01" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "updatedAt", error: { type: "TIMESTAMP_INVALID" } },
      ],
    });
    expect(hardDeleteBookRepository.findBook).not.toHaveBeenCalled();
    expect(hardDeleteBookRepository.deleteBook).not.toHaveBeenCalled();
  });

  it("書籍IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, hardDeleteBookRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, bookId: "", body: BODY })).rejects.toThrow("書籍IDが設定されていません。");
    expect(hardDeleteBookRepository.findBook).not.toHaveBeenCalled();
  });
});
