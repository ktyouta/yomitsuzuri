import { describe, it, expect, vi } from "vitest";
import { GetListDeletedBookUsecase } from "..";
import { UserId, type DeletedBookListItem, type IGetListDeletedBookRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");

const BOOK: DeletedBookListItem = {
  id: "01BX5ZZKBKACTAV9WEVGEMMVRZ",
  title: "テスト書籍",
  updatedAt: "2026-10-01T00:00:00.000Z",
  readingStatusId: 2,
  readingStatusLabel: "読書中",
  workCount: 2,
  icon: "📕",
};

function createRepository(list: DeletedBookListItem[], total: number) {
  return {
    findDeletedBookList: vi.fn<IGetListDeletedBookRepository["findDeletedBookList"]>().mockResolvedValue(list),
    countDeletedBook: vi.fn<IGetListDeletedBookRepository["countDeletedBook"]>().mockResolvedValue(total),
  } satisfies IGetListDeletedBookRepository;
}

describe("GetListDeletedBookUsecase", () => {
  it("取得した一覧と全件数をそのまま返し、全件数から総ページ数を算出すること", async () => {
    const usecase = new GetListDeletedBookUsecase(createRepository([BOOK], 31));

    const result = await usecase.execute({ userId: USER_ID, query: { page: 1 } });

    expect(result.value.list).toEqual([BOOK]);
    expect(result.value.total).toBe(31);
    expect(result.value.totalPages).toBe(2);
  });

  it("削除済みの書籍が0件の場合、空の一覧と総ページ数0を返すこと", async () => {
    const usecase = new GetListDeletedBookUsecase(createRepository([], 0));

    const result = await usecase.execute({ userId: USER_ID, query: { page: 1 } });

    expect(result.value.list).toEqual([]);
    expect(result.value.total).toBe(0);
    expect(result.value.totalPages).toBe(0);
  });

  it("全件数が1ページの件数ちょうどの場合、総ページ数が1になること", async () => {
    const usecase = new GetListDeletedBookUsecase(createRepository([BOOK], 30));

    const result = await usecase.execute({ userId: USER_ID, query: { page: 1 } });

    expect(result.value.totalPages).toBe(1);
  });

  it("指定したユーザー・検索条件と1ページ30件で一覧を問い合わせ、同じ検索条件で件数も問い合わせること", async () => {
    const repository = createRepository([], 0);
    const usecase = new GetListDeletedBookUsecase(repository);

    await usecase.execute({
      userId: USER_ID,
      query: {
        keyword: "テスト",
        createdAtFrom: "2026-11-19T15:00:00.000Z",
        createdAtTo: "2026-11-24T15:00:00.000Z",
        updatedAtFrom: "2026-11-20T15:00:00.000Z",
        updatedAtTo: "2026-11-25T15:00:00.000Z",
        page: 2,
      },
    });

    const [userId, query, pageSize] = repository.findDeletedBookList.mock.calls[0];
    expect(userId).toBe(USER_ID);
    expect(query.keyword).toBe("テスト");
    expect(query.createdAtFrom?.value).toBe("2026-11-19T15:00:00.000Z");
    expect(query.createdAtTo?.value).toBe("2026-11-24T15:00:00.000Z");
    expect(query.updatedAtFrom?.value).toBe("2026-11-20T15:00:00.000Z");
    expect(query.updatedAtTo?.value).toBe("2026-11-25T15:00:00.000Z");
    expect(query.page.value).toBe(2);
    expect(pageSize).toBe(30);
    expect(repository.countDeletedBook).toHaveBeenCalledWith(USER_ID, query);
  });

  it("日時を指定しない場合、日時の条件を付けずに問い合わせること", async () => {
    const repository = createRepository([], 0);
    const usecase = new GetListDeletedBookUsecase(repository);

    await usecase.execute({ userId: USER_ID, query: { page: 1 } });

    const [, query] = repository.findDeletedBookList.mock.calls[0];
    expect(query.createdAtFrom).toBeUndefined();
    expect(query.createdAtTo).toBeUndefined();
    expect(query.updatedAtFrom).toBeUndefined();
    expect(query.updatedAtTo).toBeUndefined();
  });

  it.each(["2026-11-24", "abc", "", "2026-02-30T00:00:00.000Z"])("日時の形式が不正（%s）な場合、その日時だけを条件から外して問い合わせること", async (invalid) => {
    const repository = createRepository([], 0);
    const usecase = new GetListDeletedBookUsecase(repository);

    await usecase.execute({
      userId: USER_ID,
      query: { createdAtFrom: invalid, createdAtTo: "2026-11-24T15:00:00.000Z", updatedAtFrom: invalid, updatedAtTo: invalid, page: 1 },
    });

    const [, query] = repository.findDeletedBookList.mock.calls[0];
    expect(query.createdAtFrom).toBeUndefined();
    expect(query.createdAtTo?.value).toBe("2026-11-24T15:00:00.000Z");
    expect(query.updatedAtFrom).toBeUndefined();
    expect(query.updatedAtTo).toBeUndefined();
  });

  it.each([0, 1.5, NaN])("ページ番号が%sの場合、1ページ目として一覧を問い合わせること", async (page) => {
    const repository = createRepository([], 0);
    const usecase = new GetListDeletedBookUsecase(repository);

    await usecase.execute({ userId: USER_ID, query: { page } });

    const [, query] = repository.findDeletedBookList.mock.calls[0];
    expect(query.page.value).toBe(1);
  });
});
