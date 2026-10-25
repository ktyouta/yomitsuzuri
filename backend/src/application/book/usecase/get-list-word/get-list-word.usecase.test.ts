import { describe, it, expect, vi } from "vitest";
import { GetListWordUsecase } from "..";
import type { IGetListWordRepository, WordListItem } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

const WORDS: WordListItem[] = [
  { id: "01BX5ZZKBKACTAV9WEVGEMMVT0", text: "赤い手帳", page: 12, updatedAt: "2026-10-01T00:00:00.000Z" },
  { id: "01BX5ZZKBKACTAV9WEVGEMMVT1", text: "青い封筒", page: null, updatedAt: "2026-10-02T00:00:00.000Z" },
];

function createRepository(work: { id: string } | null, words: WordListItem[]) {
  return {
    findWork: vi.fn<IGetListWordRepository["findWork"]>().mockResolvedValue(work),
    findWordList: vi.fn<IGetListWordRepository["findWordList"]>().mockResolvedValue(words),
  } satisfies IGetListWordRepository;
}

describe("GetListWordUsecase", () => {
  it("取得した気になるワード一覧をそのまま返すこと", async () => {
    const usecase = new GetListWordUsecase(createRepository({ id: WORK_ID }, WORDS));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: WORDS });
  });

  it("気になるワードが0件の場合、空の一覧を返すこと", async () => {
    const usecase = new GetListWordUsecase(createRepository({ id: WORK_ID }, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: [] });
  });

  it("作品が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetListWordUsecase(createRepository(null, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・作品IDで作品と気になるワード一覧を問い合わせること", async () => {
    const repository = createRepository({ id: WORK_ID }, WORDS);
    const usecase = new GetListWordUsecase(repository);

    await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    const [workUserId, workId] = repository.findWork.mock.calls[0];
    expect(workUserId).toBe(USER_ID);
    expect(workId.value).toBe(WORK_ID);
    const [wordUserId, wordWorkId] = repository.findWordList.mock.calls[0];
    expect(wordUserId).toBe(USER_ID);
    expect(wordWorkId.value).toBe(WORK_ID);
  });

  it("作品IDが空の場合、例外になり、作品も気になるワードも問い合わせないこと", async () => {
    const repository = createRepository({ id: WORK_ID }, WORDS);
    const usecase = new GetListWordUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, workId: "" })).rejects.toThrow("作品IDが設定されていません。");
    expect(repository.findWork).not.toHaveBeenCalled();
    expect(repository.findWordList).not.toHaveBeenCalled();
  });
});
