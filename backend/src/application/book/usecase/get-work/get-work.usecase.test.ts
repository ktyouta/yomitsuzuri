import { describe, it, expect, vi } from "vitest";
import { GetWorkUsecase } from "..";
import type { IGetWorkRepository, WorkType } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

const WORK: WorkType = {
  id: WORK_ID,
  title: "テスト作品",
  memo: null,
  iconId: 1,
  icon: "📘",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

function createRepository(work: WorkType | null) {
  return {
    findWork: vi.fn<IGetWorkRepository["findWork"]>().mockResolvedValue(work),
  } satisfies IGetWorkRepository;
}

describe("GetWorkUsecase", () => {
  it("取得した作品をそのまま返すこと", async () => {
    const usecase = new GetWorkUsecase(createRepository(WORK));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual(WORK);
  });

  it("作品が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetWorkUsecase(createRepository(null));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・作品IDで作品を問い合わせること", async () => {
    const repository = createRepository(WORK);
    const usecase = new GetWorkUsecase(repository);

    await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    const [userId, workId] = repository.findWork.mock.calls[0];
    expect(userId).toBe(USER_ID);
    expect(workId.value).toBe(WORK_ID);
  });

  it("作品IDが空の場合、例外になり、作品を問い合わせないこと", async () => {
    const repository = createRepository(WORK);
    const usecase = new GetWorkUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, workId: "" })).rejects.toThrow("作品IDが設定されていません。");
    expect(repository.findWork).not.toHaveBeenCalled();
  });
});
