import { describe, it, expect, vi } from "vitest";
import { DeleteEventUsecase } from "..";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, UserId, WorkId, type IDeleteEventRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const EVENT_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

function createEvent() {
  return EventEntity.reconstruct({
    id: EventId.of(EVENT_ID),
    workId: WorkId.of(WORK_ID),
    occurredTiming: EventOccurredTiming.of("3日目の夜"),
    content: EventContent.of("屋敷の主人が書斎で倒れているのが見つかる"),
    sortOrder: EventSortOrder.of(3),
    deleteFlg: false,
  });
}

type Options = {
  eventExists?: boolean;
};

function createUsecase({ eventExists = true }: Options = {}) {
  const deleteEventRepository = {
    findEvent: vi.fn<IDeleteEventRepository["findEvent"]>().mockResolvedValue(eventExists ? createEvent() : null),
    deleteEvent: vi.fn<IDeleteEventRepository["deleteEvent"]>().mockResolvedValue(),
  } satisfies IDeleteEventRepository;

  const usecase = new DeleteEventUsecase(deleteEventRepository);

  return { usecase, deleteEventRepository };
}

describe("DeleteEventUsecase", () => {
  it("出来事を削除済みにして時系列順を外し、1回保存して ok を返すこと", async () => {
    const { usecase, deleteEventRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result.isOk()).toBe(true);
    expect(deleteEventRepository.deleteEvent).toHaveBeenCalledTimes(1);
    const savedEvent = deleteEventRepository.deleteEvent.mock.calls[0]?.[0];
    expect(savedEvent?.toSnapshot()).toEqual({
      id: EVENT_ID,
      workId: WORK_ID,
      occurredTiming: "3日目の夜",
      content: "屋敷の主人が書斎で倒れているのが見つかる",
      sortOrder: null,
      deleteFlg: true,
    });
  });

  it("指定したユーザー・IDで出来事を取得すること", async () => {
    const { usecase, deleteEventRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    const [userId, eventId] = deleteEventRepository.findEvent.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(eventId?.value).toBe(EVENT_ID);
  });

  it("削除対象の出来事がない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, deleteEventRepository } = createUsecase({ eventExists: false });

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(deleteEventRepository.deleteEvent).not.toHaveBeenCalled();
  });

  it("出来事IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, deleteEventRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, eventId: "" })).rejects.toThrow("出来事IDが設定されていません。");
    expect(deleteEventRepository.findEvent).not.toHaveBeenCalled();
    expect(deleteEventRepository.deleteEvent).not.toHaveBeenCalled();
  });
});
