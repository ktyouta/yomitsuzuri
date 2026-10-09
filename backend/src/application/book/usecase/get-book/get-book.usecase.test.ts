import { describe, it, expect, vi } from "vitest";
import { GetBookUsecase } from "..";
import type { BookItem, IGetBookRepository, WorkItem } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = "01BX5ZZKBKACTAV9WEVGEMMVRZ";

const BOOK: BookItem = {
  id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
  title: "テスト書籍",
  publishedDate: null,
  readingStatusId: 1,
  readingStatusLabel: "未読",
  currentPage: null,
  memo: null,
  iconId: 1,
  icon: "📘",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const WORKS: WorkItem[] = [
  { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "テスト書籍", sort: 1, memo: null },
];

function createRepository(book: BookItem | null, works: WorkItem[]) {
  return {
    findBook: vi.fn<IGetBookRepository["findBook"]>().mockResolvedValue(book),
    findWork: vi.fn<IGetBookRepository["findWork"]>().mockResolvedValue(works),
  } satisfies IGetBookRepository;
}

describe("GetBookUsecase", () => {
  it("取得した書籍情報と作品一覧をそのまま返すこと", async () => {
    const usecase = new GetBookUsecase(createRepository(BOOK, WORKS));

    const result = await usecase.execute(USER_ID, BOOK_ID);

    expect(result._unsafeUnwrap().value).toEqual({ book: BOOK, works: WORKS });
  });

  it("書籍が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetBookUsecase(createRepository(null, []));

    const result = await usecase.execute(USER_ID, BOOK_ID);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・書籍IDで書籍と作品一覧を問い合わせること", async () => {
    const repository = createRepository(BOOK, WORKS);
    const usecase = new GetBookUsecase(repository);

    await usecase.execute(USER_ID, BOOK_ID);

    const [bookUserId, bookId] = repository.findBook.mock.calls[0];
    expect(bookUserId).toBe(USER_ID);
    expect(bookId.value).toBe(BOOK_ID);
    const [workUserId, workBookId] = repository.findWork.mock.calls[0];
    expect(workUserId).toBe(USER_ID);
    expect(workBookId.value).toBe(BOOK_ID);
  });

  it("書籍IDが空の場合、例外になり、書籍も作品も問い合わせないこと", async () => {
    const repository = createRepository(BOOK, WORKS);
    const usecase = new GetBookUsecase(repository);

    await expect(usecase.execute(USER_ID, "")).rejects.toThrow("書籍IDが設定されていません。");
    expect(repository.findBook).not.toHaveBeenCalled();
    expect(repository.findWork).not.toHaveBeenCalled();
  });
});
