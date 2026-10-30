import { describe, it, expect, vi } from "vitest";
import { GetListEventUsecase } from "..";
import type { EventListItem, IGetListEventRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

const EVENTS: EventListItem[] = [
  { id: "01BX5ZZKBKACTAV9WEVGEMMVT0", occurredTiming: "3日目の夜", content: "屋敷の主人が書斎で倒れているのが見つかる", sortOrder: 1 },
  { id: "01BX5ZZKBKACTAV9WEVGEMMVT1", occurredTiming: null, content: "執事が鍵の行方を問われる", sortOrder: 2 },
];

function createRepository(work: { id: string } | null, events: EventListItem[]) {
  return {
    findWork: vi.fn<IGetListEventRepository["findWork"]>().mockResolvedValue(work),
    findEventList: vi.fn<IGetListEventRepository["findEventList"]>().mockResolvedValue(events),
  } satisfies IGetListEventRepository;
}

describe("GetListEventUsecase", () => {
  it("取得した出来事一覧をそのまま返すこと", async () => {
    const usecase = new GetListEventUsecase(createRepository({ id: WORK_ID }, EVENTS));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: EVENTS });
  });

  it("出来事が0件の場合、空の一覧を返すこと", async () => {
    const usecase = new GetListEventUsecase(createRepository({ id: WORK_ID }, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: [] });
  });

  it("作品が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetListEventUsecase(createRepository(null, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・作品IDで作品と出来事一覧を問い合わせること", async () => {
    const repository = createRepository({ id: WORK_ID }, EVENTS);
    const usecase = new GetListEventUsecase(repository);

    await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    const [workUserId, workId] = repository.findWork.mock.calls[0];
    expect(workUserId).toBe(USER_ID);
    expect(workId.value).toBe(WORK_ID);
    const [eventUserId, eventWorkId] = repository.findEventList.mock.calls[0];
    expect(eventUserId).toBe(USER_ID);
    expect(eventWorkId.value).toBe(WORK_ID);
  });

  it("作品IDが空の場合、例外になり、作品も出来事も問い合わせないこと", async () => {
    const repository = createRepository({ id: WORK_ID }, EVENTS);
    const usecase = new GetListEventUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, workId: "" })).rejects.toThrow("作品IDが設定されていません。");
    expect(repository.findWork).not.toHaveBeenCalled();
    expect(repository.findEventList).not.toHaveBeenCalled();
  });
});
