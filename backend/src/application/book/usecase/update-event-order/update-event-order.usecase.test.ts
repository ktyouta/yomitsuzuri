import { describe, it, expect, vi } from "vitest";
import { UpdateEventOrderUsecase } from "..";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, WorkId, type IUpdateEventOrderRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const EVENT_ID_1 = "01BX5ZZKBKACTAV9WEVGEMMVT1";
const EVENT_ID_2 = "01BX5ZZKBKACTAV9WEVGEMMVT2";

/** 出来事1・出来事2の時系列順を入れ替えるリクエスト */
const BODY = {
  events: [
    { id: EVENT_ID_1, sortOrder: 2 },
    { id: EVENT_ID_2, sortOrder: 1 },
  ],
};

function createEvent(id: string, sortOrder: number) {
  return EventEntity.reconstruct({
    id: EventId.of(id),
    workId: WorkId.of(WORK_ID),
    occurredTiming: EventOccurredTiming.of("3日目の夜"),
    content: EventContent.of(`内容${id}`),
    sortOrder: EventSortOrder.of(sortOrder),
    deleteFlg: false,
  });
}

/** 出来事1（時系列順1）・出来事2（時系列順2）を持つ出来事の並び */
function createTimeline() {
  return EventTimelineAggregate.reconstruct({
    workId: WorkId.of(WORK_ID),
    events: [createEvent(EVENT_ID_1, 1), createEvent(EVENT_ID_2, 2)],
  });
}

type Options = {
  workExists?: boolean;
};

function createUsecase({ workExists = true }: Options = {}) {
  const updateEventOrderRepository = {
    findWork: vi.fn<IUpdateEventOrderRepository["findWork"]>().mockResolvedValue(workExists ? { id: WORK_ID } : null),
    findEventTimeline: vi.fn<IUpdateEventOrderRepository["findEventTimeline"]>().mockResolvedValue(createTimeline()),
    updateEventOrder: vi.fn<IUpdateEventOrderRepository["updateEventOrder"]>().mockResolvedValue(),
  } satisfies IUpdateEventOrderRepository;

  const usecase = new UpdateEventOrderUsecase(updateEventOrderRepository);

  return { usecase, updateEventOrderRepository };
}

describe("UpdateEventOrderUsecase", () => {
  it("各出来事の時系列順を置き換えて保存し、時系列順以外は変えずに、時系列順の昇順で返すこと", async () => {
    const { usecase, updateEventOrderRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(updateEventOrderRepository.updateEventOrder).toHaveBeenCalledTimes(1);
    const savedTimeline = updateEventOrderRepository.updateEventOrder.mock.calls[0]?.[0];
    expect(savedTimeline?.toSnapshot()).toEqual([
      createEvent(EVENT_ID_1, 2).toSnapshot(),
      createEvent(EVENT_ID_2, 1).toSnapshot(),
    ]);

    expect(result._unsafeUnwrap().value).toEqual({
      list: [
        { id: EVENT_ID_2, occurredTiming: "3日目の夜", content: `内容${EVENT_ID_2}`, sortOrder: 1 },
        { id: EVENT_ID_1, occurredTiming: "3日目の夜", content: `内容${EVENT_ID_1}`, sortOrder: 2 },
      ],
    });
  });

  it("指定したユーザー・作品IDで作品と出来事の並びを問い合わせること", async () => {
    const { usecase, updateEventOrderRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    const [findWorkUserId, findWorkWorkId] = updateEventOrderRepository.findWork.mock.calls[0] ?? [];
    expect(findWorkUserId).toBe(USER_ID);
    expect(findWorkWorkId?.value).toBe(WORK_ID);
    const [timelineUserId, timelineWorkId] = updateEventOrderRepository.findEventTimeline.mock.calls[0] ?? [];
    expect(timelineUserId).toBe(USER_ID);
    expect(timelineWorkId?.value).toBe(WORK_ID);
  });

  it("作品が取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateEventOrderRepository } = createUsecase({ workExists: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateEventOrderRepository.updateEventOrder).not.toHaveBeenCalled();
  });

  it("指定した出来事が作品内の出来事と一致しない場合、EVENT_MISMATCH を返し、保存しないこと", async () => {
    const { usecase, updateEventOrderRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { events: [{ id: EVENT_ID_1, sortOrder: 1 }] } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "EVENT_MISMATCH" });
    expect(updateEventOrderRepository.updateEventOrder).not.toHaveBeenCalled();
  });

  it("時系列順が重複する場合、DUPLICATE_SORT_ORDER を返し、保存しないこと", async () => {
    const { usecase, updateEventOrderRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID,
      body: { events: [{ id: EVENT_ID_1, sortOrder: 1 }, { id: EVENT_ID_2, sortOrder: 1 }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_SORT_ORDER" });
    expect(updateEventOrderRepository.updateEventOrder).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, updateEventOrderRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID,
      body: { events: [{ id: "", sortOrder: 0 }, { id: EVENT_ID_2, sortOrder: 1.5 }] },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "events.0.id", error: { type: "EVENT_ID_EMPTY" } },
        { field: "events.0.sortOrder", error: { type: "EVENT_SORT_ORDER_INVALID", min: 1 } },
        { field: "events.1.sortOrder", error: { type: "EVENT_SORT_ORDER_INVALID", min: 1 } },
      ],
    });
    expect(updateEventOrderRepository.findWork).not.toHaveBeenCalled();
    expect(updateEventOrderRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(updateEventOrderRepository.updateEventOrder).not.toHaveBeenCalled();
  });

  it("作品IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, updateEventOrderRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow();
    expect(updateEventOrderRepository.findWork).not.toHaveBeenCalled();
    expect(updateEventOrderRepository.updateEventOrder).not.toHaveBeenCalled();
  });
});
