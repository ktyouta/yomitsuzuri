import { describe, it, expect, vi } from "vitest";
import { UpdateEventUsecase } from "..";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, WorkId, type IUpdateEventRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const EVENT_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

const BODY = {
  occurredTiming: "4日目の朝",
  content: "執事が鍵を隠していたことが分かる",
};

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
  const updateEventRepository = {
    findEvent: vi.fn<IUpdateEventRepository["findEvent"]>().mockResolvedValue(eventExists ? createEvent() : null),
    updateEvent: vi.fn<IUpdateEventRepository["updateEvent"]>().mockResolvedValue(),
  } satisfies IUpdateEventRepository;

  const usecase = new UpdateEventUsecase(updateEventRepository);

  return { usecase, updateEventRepository };
}

describe("UpdateEventUsecase", () => {
  it("発生タイミング・内容を更新内容で保存し、ID・作品・時系列順・削除フラグは変えずに返すこと", async () => {
    const { usecase, updateEventRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID, body: BODY });

    expect(updateEventRepository.updateEvent).toHaveBeenCalledTimes(1);
    const savedEvent = updateEventRepository.updateEvent.mock.calls[0]?.[0];
    expect(savedEvent?.toSnapshot()).toEqual({
      id: EVENT_ID,
      workId: WORK_ID,
      occurredTiming: "4日目の朝",
      content: "執事が鍵を隠していたことが分かる",
      sortOrder: 3,
      deleteFlg: false,
    });

    expect(result._unsafeUnwrap().value).toEqual({
      id: EVENT_ID,
      workId: WORK_ID,
      occurredTiming: "4日目の朝",
      content: "執事が鍵を隠していたことが分かる",
      sortOrder: 3,
    });
  });

  it("発生タイミングが未指定の場合、null で保存されること", async () => {
    const { usecase, updateEventRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, eventId: EVENT_ID, body: { content: BODY.content } });

    expect(updateEventRepository.updateEvent.mock.calls[0]?.[0].occurredTiming.value).toBeNull();
  });

  it("指定したユーザー・IDで出来事を問い合わせること", async () => {
    const { usecase, updateEventRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, eventId: EVENT_ID, body: BODY });

    const [userId, eventId] = updateEventRepository.findEvent.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(eventId?.value).toBe(EVENT_ID);
  });

  it("出来事が取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateEventRepository } = createUsecase({ eventExists: false });

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateEventRepository.updateEvent).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, updateEventRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      eventId: EVENT_ID,
      body: {
        occurredTiming: "あ".repeat(101),
        content: "   ",
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "occurredTiming", error: { type: "EVENT_OCCURRED_TIMING_TOO_LONG", max: 100 } },
        { field: "content", error: { type: "EVENT_CONTENT_EMPTY" } },
      ],
    });
    expect(updateEventRepository.findEvent).not.toHaveBeenCalled();
    expect(updateEventRepository.updateEvent).not.toHaveBeenCalled();
  });

  it("違反している項目だけを INVALID_INPUT で返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID, body: { ...BODY, content: "   " } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "content", error: { type: "EVENT_CONTENT_EMPTY" } }],
    });
  });

  it("出来事IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, updateEventRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, eventId: "", body: BODY })).rejects.toThrow("出来事IDが設定されていません。");
    expect(updateEventRepository.findEvent).not.toHaveBeenCalled();
    expect(updateEventRepository.updateEvent).not.toHaveBeenCalled();
  });
});
