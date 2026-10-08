import { describe, it, expect, vi } from "vitest";
import { GetListBookUsecase } from "..";
import type { BookListItem, IGetListBookRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");

const BOOK: BookListItem = {
  id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
  title: "テスト書籍",
  updatedAt: "2026-10-01T00:00:00.000Z",
  readingStatusId: 2,
  readingStatusLabel: "読書中",
  workCount: 2,
  icon: "📕",
};

function createRepository(list: BookListItem[], total: number) {
  return {
    findList: vi.fn<IGetListBookRepository["findList"]>().mockResolvedValue(list),
    count: vi.fn<IGetListBookRepository["count"]>().mockResolvedValue(total),
  } satisfies IGetListBookRepository;
}

describe("GetListBookUsecase", () => {
  it("取得した一覧と全件数をそのまま返し、全件数から総ページ数を算出すること", async () => {
    const usecase = new GetListBookUsecase(createRepository([BOOK], 31));

    const result = await usecase.execute(USER_ID, 1);

    expect(result.value.list).toEqual([BOOK]);
    expect(result.value.total).toBe(31);
    expect(result.value.totalPages).toBe(2);
  });

  it("書籍が0件の場合、空の一覧と総ページ数0を返すこと", async () => {
    const usecase = new GetListBookUsecase(createRepository([], 0));

    const result = await usecase.execute(USER_ID, 1);

    expect(result.value.list).toEqual([]);
    expect(result.value.total).toBe(0);
    expect(result.value.totalPages).toBe(0);
  });

  it("指定したユーザー・ページ番号と1ページ30件で一覧を問い合わせ、全件数も問い合わせること", async () => {
    const repository = createRepository([], 0);
    const usecase = new GetListBookUsecase(repository);

    await usecase.execute(USER_ID, 2);

    const [userId, pagination, pageSize] = repository.findList.mock.calls[0];
    expect(userId).toBe(USER_ID);
    expect(pagination.page).toBe(2);
    expect(pageSize).toBe(30);
    expect(repository.count).toHaveBeenCalledWith(USER_ID);
  });

  it("全件数が1ページの件数ちょうどの場合、総ページ数が1になること", async () => {
    const usecase = new GetListBookUsecase(createRepository([BOOK], 30));

    const result = await usecase.execute(USER_ID, 1);

    expect(result.value.totalPages).toBe(1);
  });

  it("ページ番号が0の場合、例外になり、一覧も全件数も問い合わせないこと", async () => {
    const repository = createRepository([], 0);
    const usecase = new GetListBookUsecase(repository);

    await expect(usecase.execute(USER_ID, 0)).rejects.toThrow("ページ番号は1以上の整数で指定してください。");
    expect(repository.findList).not.toHaveBeenCalled();
    expect(repository.count).not.toHaveBeenCalled();
  });
});
