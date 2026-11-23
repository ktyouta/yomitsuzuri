import { describe, expect, it, vi } from "vitest";
import { EventId, UserId, type IHardDeleteEventRepository } from "../../../../domain";
import { HardDeleteEventUsecase } from "./hard-delete-event.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const EVENT_ID = "01ARZ3NDEKTSV4RRFFQ69G5FB0";

type Options = {
  deleted?: boolean;
};

function createUsecase({ deleted = true }: Options = {}) {
  const hardDeleteEventRepository = {
    deleteEvent: vi.fn<IHardDeleteEventRepository["deleteEvent"]>().mockResolvedValue(deleted),
  } satisfies IHardDeleteEventRepository;

  const usecase = new HardDeleteEventUsecase(hardDeleteEventRepository);

  return { usecase, hardDeleteEventRepository };
}

describe("HardDeleteEventUsecase", () => {
  it("指定したユーザー・出来事IDで1回物理削除し、ok を返すこと", async () => {
    const { usecase, hardDeleteEventRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result.isOk()).toBe(true);
    expect(hardDeleteEventRepository.deleteEvent).toHaveBeenCalledTimes(1);
    expect(hardDeleteEventRepository.deleteEvent).toHaveBeenCalledWith(USER_ID, EventId.of(EVENT_ID));
  });

  it("削除済みの出来事がなく削除されなかった場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("出来事IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, hardDeleteEventRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, eventId: "" })).rejects.toThrow("出来事IDが設定されていません。");
    expect(hardDeleteEventRepository.deleteEvent).not.toHaveBeenCalled();
  });
});
