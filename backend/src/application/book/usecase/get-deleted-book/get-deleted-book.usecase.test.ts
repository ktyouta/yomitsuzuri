import { describe, it, expect, vi } from "vitest";
import { GetDeletedBookUsecase } from "..";
import { UserId, type AuthorItem, type DeletedBookItem, type DeletedBookWorkItem, type IGetDeletedBookRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = "01BX5ZZKBKACTAV9WEVGEMMVRZ";

const BOOK: DeletedBookItem = {
  id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
  title: "テスト書籍",
  publishedDate: null,
  readingStatusId: 1,
  readingStatusLabel: "未読",
  currentPage: null,
  memo: null,
  icon: "📘",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

const WORKS: DeletedBookWorkItem[] = [
  { id: "01BX5ZZKBKACTAV9WEVGEMMVS0", title: "テスト書籍", memo: null, icon: "📘" },
];

const AUTHORS: AuthorItem[] = [
  { name: "著者A" },
  { name: "著者B" },
];

function createRepository(book: DeletedBookItem | null, works: DeletedBookWorkItem[], authors: AuthorItem[]) {
  return {
    findDeletedBook: vi.fn<IGetDeletedBookRepository["findDeletedBook"]>().mockResolvedValue(book),
    findDeletedBookWork: vi.fn<IGetDeletedBookRepository["findDeletedBookWork"]>().mockResolvedValue(works),
    findDeletedBookAuthor: vi.fn<IGetDeletedBookRepository["findDeletedBookAuthor"]>().mockResolvedValue(authors),
  } satisfies IGetDeletedBookRepository;
}

describe("GetDeletedBookUsecase", () => {
  it("取得した書籍情報・作品一覧・著者一覧をそのまま返すこと", async () => {
    const usecase = new GetDeletedBookUsecase(createRepository(BOOK, WORKS, AUTHORS));

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ ...BOOK, works: WORKS, authors: AUTHORS });
  });

  it("書籍が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetDeletedBookUsecase(createRepository(null, [], []));

    const result = await usecase.execute({ userId: USER_ID, bookId: BOOK_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・書籍IDで書籍・作品一覧・著者一覧を問い合わせること", async () => {
    const repository = createRepository(BOOK, WORKS, AUTHORS);
    const usecase = new GetDeletedBookUsecase(repository);

    await usecase.execute({ userId: USER_ID, bookId: BOOK_ID });

    const [bookUserId, bookId] = repository.findDeletedBook.mock.calls[0];
    expect(bookUserId).toBe(USER_ID);
    expect(bookId.value).toBe(BOOK_ID);
    const [workUserId, workBookId] = repository.findDeletedBookWork.mock.calls[0];
    expect(workUserId).toBe(USER_ID);
    expect(workBookId.value).toBe(BOOK_ID);
    const [authorUserId, authorBookId] = repository.findDeletedBookAuthor.mock.calls[0];
    expect(authorUserId).toBe(USER_ID);
    expect(authorBookId.value).toBe(BOOK_ID);
  });

  it("書籍IDが空の場合、例外になり、書籍も作品も著者も問い合わせないこと", async () => {
    const repository = createRepository(BOOK, WORKS, AUTHORS);
    const usecase = new GetDeletedBookUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, bookId: "" })).rejects.toThrow("書籍IDが設定されていません。");
    expect(repository.findDeletedBook).not.toHaveBeenCalled();
    expect(repository.findDeletedBookWork).not.toHaveBeenCalled();
    expect(repository.findDeletedBookAuthor).not.toHaveBeenCalled();
  });
});
