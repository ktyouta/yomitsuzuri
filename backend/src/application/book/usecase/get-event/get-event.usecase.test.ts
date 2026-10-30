import { describe, it, expect, vi } from "vitest";
import { GetEventUsecase } from "..";
import type { EventDetail, IGetEventRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const EVENT_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

const EVENT: EventDetail = {
  id: EVENT_ID,
  occurredTiming: "3日目の夜",
  content: "屋敷の主人が書斎で倒れているのが見つかる",
};

function createRepository(event: EventDetail | null) {
  return {
    findEvent: vi.fn<IGetEventRepository["findEvent"]>().mockResolvedValue(event),
  } satisfies IGetEventRepository;
}

describe("GetEventUsecase", () => {
  it("取得した出来事をそのまま返すこと", async () => {
    const usecase = new GetEventUsecase(createRepository(EVENT));

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrap().value).toEqual(EVENT);
  });

  it("発生タイミングが未入力の出来事も、そのまま返すこと", async () => {
    const event: EventDetail = { ...EVENT, occurredTiming: null };
    const usecase = new GetEventUsecase(createRepository(event));

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrap().value).toEqual(event);
  });

  it("出来事が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetEventUsecase(createRepository(null));

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・出来事IDで出来事を問い合わせること", async () => {
    const repository = createRepository(EVENT);
    const usecase = new GetEventUsecase(repository);

    await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    const [userId, eventId] = repository.findEvent.mock.calls[0];
    expect(userId).toBe(USER_ID);
    expect(eventId.value).toBe(EVENT_ID);
  });

  it("出来事IDが空の場合、例外になり、出来事を問い合わせないこと", async () => {
    const repository = createRepository(EVENT);
    const usecase = new GetEventUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, eventId: "" })).rejects.toThrow("出来事IDが設定されていません。");
    expect(repository.findEvent).not.toHaveBeenCalled();
  });
});
