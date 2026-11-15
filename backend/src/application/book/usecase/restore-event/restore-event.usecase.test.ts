import { describe, it, expect, vi } from "vitest";
import { RestoreEventUsecase } from "..";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, UserId, WorkId, type IRestoreEventRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const EVENT_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";
const OTHER_EVENT_ID = "01BX5ZZKBKACTAV9WEVGEMMVT1";

function createEvent(id: string, sortOrder: number | null, deleteFlg: boolean) {
  return EventEntity.reconstruct({
    id: EventId.of(id),
    workId: WorkId.of(WORK_ID),
    occurredTiming: EventOccurredTiming.of("3日目の夜"),
    content: EventContent.of("屋敷の主人が書斎で倒れているのが見つかる"),
    sortOrder: EventSortOrder.of(sortOrder),
    deleteFlg,
  });
}

/**
 * 復元対象の出来事（削除済みかどうかを指定）と、時系列順 2 の削除されていない出来事を持つ並び
 */
function createEventTimeline(targetDeleted: boolean) {
  return EventTimelineAggregate.reconstruct({
    workId: WorkId.of(WORK_ID),
    events: [
      createEvent(OTHER_EVENT_ID, 2, false),
      targetDeleted ? createEvent(EVENT_ID, null, true) : createEvent(EVENT_ID, 1, false),
    ],
  });
}

type Options = {
  timelineExists?: boolean;
  targetDeleted?: boolean;
};

function createUsecase({ timelineExists = true, targetDeleted = true }: Options = {}) {
  const restoreEventRepository = {
    findEventTimeline: vi.fn<IRestoreEventRepository["findEventTimeline"]>()
      .mockResolvedValue(timelineExists ? createEventTimeline(targetDeleted) : null),
    restoreEvent: vi.fn<IRestoreEventRepository["restoreEvent"]>().mockResolvedValue(),
  } satisfies IRestoreEventRepository;

  const usecase = new RestoreEventUsecase(restoreEventRepository);

  return { usecase, restoreEventRepository };
}

const EXPECTED_VALUE = {
  id: EVENT_ID,
  workId: WORK_ID,
  occurredTiming: "3日目の夜",
  content: "屋敷の主人が書斎で倒れているのが見つかる",
  sortOrder: 3,
};

describe("RestoreEventUsecase", () => {
  it("出来事の削除済みを解除し、時系列順を削除されていない出来事の最大値+1にして1回保存し、復元した出来事を返すこと", async () => {
    const { usecase, restoreEventRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrap().value).toEqual(EXPECTED_VALUE);
    expect(restoreEventRepository.restoreEvent).toHaveBeenCalledTimes(1);
    const savedEvent = restoreEventRepository.restoreEvent.mock.calls[0]?.[0];
    expect(savedEvent?.toSnapshot()).toEqual({ ...EXPECTED_VALUE, deleteFlg: false });
  });

  it("指定したユーザー・IDで出来事の並びを問い合わせること", async () => {
    const { usecase, restoreEventRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    const [userId, eventId] = restoreEventRepository.findEventTimeline.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(eventId?.value).toBe(EVENT_ID);
  });

  it("出来事の並びが取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, restoreEventRepository } = createUsecase({ timelineExists: false });

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(restoreEventRepository.restoreEvent).not.toHaveBeenCalled();
  });

  it("出来事が削除されていない場合、EVENT_NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, restoreEventRepository } = createUsecase({ targetDeleted: false });

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "EVENT_NOT_FOUND" });
    expect(restoreEventRepository.restoreEvent).not.toHaveBeenCalled();
  });

  it("出来事IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, restoreEventRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, eventId: "" })).rejects.toThrow("出来事IDが設定されていません。");
    expect(restoreEventRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(restoreEventRepository.restoreEvent).not.toHaveBeenCalled();
  });
});
