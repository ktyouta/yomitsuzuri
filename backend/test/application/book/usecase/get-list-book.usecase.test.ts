import { describe, it, expect, vi } from "vitest";
import { GetListBookUsecase } from "../../../../src/application/book/usecase";
import { BookId } from "../../../../src/domain/book";
import type { BookListItem, BookListPageResult, IGetListBookRepository } from "../../../../src/domain/book";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

const BOOK: BookListItem = {
  id: BookId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
  title: "テスト書籍",
  updatedAt: "2026-10-01T00:00:00.000Z",
  readingStatus: "reading",
  readingStatusLabel: "読書中",
  workCount: 2,
  icon: "📕",
};

function createRepository(result: BookListPageResult) {
  return {
    findList: vi.fn<IGetListBookRepository["findList"]>().mockResolvedValue(result),
  } satisfies IGetListBookRepository;
}

describe("GetListBookUsecase", () => {
  it("取得した一覧と全件数をそのまま返し、全件数から総ページ数を算出すること", async () => {
    const usecase = new GetListBookUsecase(createRepository({ list: [BOOK], total: 31 }));

    const result = await usecase.execute(USER_ID, 1);

    expect(result.value.list).toEqual([{ ...BOOK, id: "01BX5ZZKBKACTAV9WEVGEMMVRZ" }]);
    expect(result.value.total).toBe(31);
    expect(result.value.totalPages).toBe(2);
  });

  it("書籍が0件の場合、空の一覧と総ページ数0を返すこと", async () => {
    const usecase = new GetListBookUsecase(createRepository({ list: [], total: 0 }));

    const result = await usecase.execute(USER_ID, 1);

    expect(result.value.list).toEqual([]);
    expect(result.value.total).toBe(0);
    expect(result.value.totalPages).toBe(0);
  });

  it("指定したページに対応する範囲で、指定したユーザーの一覧を問い合わせること", async () => {
    const repository = createRepository({ list: [], total: 0 });
    const usecase = new GetListBookUsecase(repository);

    await usecase.execute(USER_ID, 2);

    const [userId, pagination] = repository.findList.mock.calls[0];
    expect(userId.value).toBe(USER_ID);
    expect(pagination.offset).toBe(30);
    expect(pagination.limit).toBe(30);
  });

  it("ユーザーIDが空の場合、例外になり、一覧を問い合わせないこと", async () => {
    const repository = createRepository({ list: [], total: 0 });
    const usecase = new GetListBookUsecase(repository);

    await expect(usecase.execute("", 1)).rejects.toThrow("ユーザーIDが設定されていません。");
    expect(repository.findList).not.toHaveBeenCalled();
  });

  it("ページ番号が0の場合、例外になり、一覧を問い合わせないこと", async () => {
    const repository = createRepository({ list: [], total: 0 });
    const usecase = new GetListBookUsecase(repository);

    await expect(usecase.execute(USER_ID, 0)).rejects.toThrow("ページ番号は1以上の整数で指定してください。");
    expect(repository.findList).not.toHaveBeenCalled();
  });
});
