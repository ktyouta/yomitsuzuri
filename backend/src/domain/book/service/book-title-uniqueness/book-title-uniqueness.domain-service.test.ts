import { describe, it, expect, vi } from "vitest";
import { BookId, BookTitle, BookTitleUniquenessDomainService, type IBookTitleUniquenessRepository } from "../../..";
import { UserId } from "../../../shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = BookId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
const BOOK_TITLE = new BookTitle("テスト書籍");

function createRepository(result: { id: string }[]) {
  return {
    findBook: vi.fn<IBookTitleUniquenessRepository["findBook"]>().mockResolvedValue(result),
  } satisfies IBookTitleUniquenessRepository;
}

describe("BookTitleUniquenessDomainService", () => {
  it("同名書籍が1件以上ある場合、true を返すこと", async () => {
    const service = new BookTitleUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ" }]));

    expect(await service.isDuplicated({ userId: USER_ID, bookId: BOOK_ID, bookTitle: BOOK_TITLE })).toBe(true);
  });

  it("同名書籍が0件の場合、false を返すこと", async () => {
    const service = new BookTitleUniquenessDomainService(createRepository([]));

    expect(await service.isDuplicated({ userId: USER_ID, bookId: BOOK_ID, bookTitle: BOOK_TITLE })).toBe(false);
  });

  it("渡したユーザーID・書籍ID・タイトルで Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new BookTitleUniquenessDomainService(repository);

    await service.isDuplicated({ userId: USER_ID, bookId: BOOK_ID, bookTitle: BOOK_TITLE });

    expect(repository.findBook).toHaveBeenCalledWith(USER_ID, BOOK_ID, BOOK_TITLE);
  });
});
