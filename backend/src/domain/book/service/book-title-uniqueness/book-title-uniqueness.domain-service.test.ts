import { describe, it, expect, vi } from "vitest";
import { BookId, BookTitle, BookTitleUniquenessDomainService, type IBookTitleUniquenessRepository } from "../../..";
import { UserId } from "../../../shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const BOOK_ID = BookId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
const BOOK_TITLE = BookTitle.of("テスト書籍");

function createRepository(result: { id: string, deleteFlg: boolean }[]) {
  return {
    findBook: vi.fn<IBookTitleUniquenessRepository["findBook"]>().mockResolvedValue(result),
  } satisfies IBookTitleUniquenessRepository;
}

describe("BookTitleUniquenessDomainService", () => {
  it("削除されていない同名書籍がある場合、DUPLICATE_TITLE を返すこと", async () => {
    const service = new BookTitleUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false }]));

    const result = await service.validate(USER_ID, BOOK_ID, BOOK_TITLE);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TITLE" });
  });

  it("削除済みの同名書籍だけがある場合、DUPLICATE_DELETED_TITLE を返すこと", async () => {
    const service = new BookTitleUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: true }]));

    const result = await service.validate(USER_ID, BOOK_ID, BOOK_TITLE);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_TITLE" });
  });

  it("削除済みと削除されていない同名書籍の両方がある場合、DUPLICATE_TITLE を返すこと", async () => {
    const service = new BookTitleUniquenessDomainService(createRepository([
      { id: "01HYYYYYYYYYYYYYYYYYYYYYYY", deleteFlg: true },
      { id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false },
    ]));

    const result = await service.validate(USER_ID, BOOK_ID, BOOK_TITLE);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TITLE" });
  });

  it("同名書籍が0件の場合、ok を返すこと", async () => {
    const service = new BookTitleUniquenessDomainService(createRepository([]));

    const result = await service.validate(USER_ID, BOOK_ID, BOOK_TITLE);

    expect(result.isOk()).toBe(true);
  });

  it("渡したユーザーID・書籍ID・タイトルで Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new BookTitleUniquenessDomainService(repository);

    await service.validate(USER_ID, BOOK_ID, BOOK_TITLE);

    expect(repository.findBook).toHaveBeenCalledWith(USER_ID, BOOK_ID, BOOK_TITLE);
  });
});
