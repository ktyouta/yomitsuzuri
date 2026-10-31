import { describe, expect, it, vi } from "vitest";
import { CreateEventUsecase } from "..";
import { EventContent, EventEntity, EventId, EventOccurredTiming, EventSortOrder, EventTimelineAggregate, WorkId, type ICreateEventRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const BODY = {
  occurredTiming: "3日目の夜",
  content: "屋敷の主人が書斎で倒れているのが見つかる",
};

type Options = {
  workExists?: boolean;
  existingSortOrders?: number[];
};

function createTimeline(sortOrders: number[]) {
  return EventTimelineAggregate.reconstruct({
    workId: WorkId.of(WORK_ID),
    events: sortOrders.map((sortOrder, index) => EventEntity.reconstruct({
      id: EventId.of(`01BX5ZZKBKACTAV9WEVGEMMVT${index}`),
      workId: WorkId.of(WORK_ID),
      occurredTiming: EventOccurredTiming.of(null),
      content: EventContent.of("既存の出来事"),
      sortOrder: EventSortOrder.of(sortOrder),
      deleteFlg: false,
    })),
  });
}

function createUsecase({ workExists = true, existingSortOrders = [] }: Options = {}) {
  const createEventRepository = {
    findWork: vi.fn<ICreateEventRepository["findWork"]>().mockResolvedValue(workExists ? { id: WORK_ID } : null),
    findEventTimeline: vi.fn<ICreateEventRepository["findEventTimeline"]>().mockResolvedValue(createTimeline(existingSortOrders)),
    createEvent: vi.fn<ICreateEventRepository["createEvent"]>().mockResolvedValue(),
  } satisfies ICreateEventRepository;

  const usecase = new CreateEventUsecase(createEventRepository);

  return { usecase, createEventRepository };
}

describe("CreateEventUsecase", () => {
  it("指定した作品に出来事を保存し、その内容を返すこと", async () => {
    const { usecase, createEventRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(createEventRepository.createEvent).toHaveBeenCalledTimes(1);
    const savedEvent = createEventRepository.createEvent.mock.calls[0]?.[0];
    expect(savedEvent?.toSnapshot()).toEqual({
      id: expect.stringMatching(ULID_PATTERN),
      workId: WORK_ID,
      occurredTiming: "3日目の夜",
      content: "屋敷の主人が書斎で倒れているのが見つかる",
      sortOrder: 1,
      deleteFlg: false,
    });

    expect(result._unsafeUnwrap().value).toEqual({
      id: savedEvent?.id.value,
      workId: WORK_ID,
      occurredTiming: "3日目の夜",
      content: "屋敷の主人が書斎で倒れているのが見つかる",
      sortOrder: 1,
    });
  });

  it("既存の出来事がある場合、時系列順の末尾（最大値+1）に追加すること", async () => {
    const { usecase, createEventRepository } = createUsecase({ existingSortOrders: [2, 5, 3] });

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(createEventRepository.createEvent.mock.calls[0]?.[0].sortOrder.value).toBe(6);
  });

  it("発生タイミングが未指定の場合、null で保存されること", async () => {
    const { usecase, createEventRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { content: BODY.content } });

    expect(createEventRepository.createEvent.mock.calls[0]?.[0].occurredTiming.value).toBeNull();
  });

  it("作品が取得できない場合、NOT_FOUND を返し、出来事の並びを問い合わせず保存しないこと", async () => {
    const { usecase, createEventRepository } = createUsecase({ workExists: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(createEventRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(createEventRepository.createEvent).not.toHaveBeenCalled();
  });

  it("指定したユーザー・作品IDで作品と出来事の並びを問い合わせること", async () => {
    const { usecase, createEventRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    const [workUserId, workId] = createEventRepository.findWork.mock.calls[0] ?? [];
    expect(workUserId).toBe(USER_ID);
    expect(workId?.value).toBe(WORK_ID);
    const [timelineUserId, timelineWorkId] = createEventRepository.findEventTimeline.mock.calls[0] ?? [];
    expect(timelineUserId).toBe(USER_ID);
    expect(timelineWorkId?.value).toBe(WORK_ID);
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, createEventRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID,
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
    expect(createEventRepository.findWork).not.toHaveBeenCalled();
    expect(createEventRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(createEventRepository.createEvent).not.toHaveBeenCalled();
  });

  it("違反している項目だけを INVALID_INPUT で返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { ...BODY, content: "   " } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "content", error: { type: "EVENT_CONTENT_EMPTY" } }],
    });
  });

  it("作品IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, createEventRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow("作品IDが設定されていません。");
    expect(createEventRepository.findWork).not.toHaveBeenCalled();
    expect(createEventRepository.findEventTimeline).not.toHaveBeenCalled();
    expect(createEventRepository.createEvent).not.toHaveBeenCalled();
  });
});
