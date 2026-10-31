import { describe, it, expect, vi } from "vitest";
import { DeleteEventUsecase } from "..";
import type { IDeleteEventRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const EVENT_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

type Options = {
  deleted?: boolean;
};

function createUsecase({ deleted = true }: Options = {}) {
  const deleteEventRepository = {
    deleteEvent: vi.fn<IDeleteEventRepository["deleteEvent"]>().mockResolvedValue(deleted),
  } satisfies IDeleteEventRepository;

  const usecase = new DeleteEventUsecase(deleteEventRepository);

  return { usecase, deleteEventRepository };
}

describe("DeleteEventUsecase", () => {
  it("出来事を削除できた場合、ok を返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result.isOk()).toBe(true);
  });

  it("指定したユーザー・IDで出来事を1回削除すること", async () => {
    const { usecase, deleteEventRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(deleteEventRepository.deleteEvent).toHaveBeenCalledTimes(1);
    const [userId, eventId] = deleteEventRepository.deleteEvent.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(eventId?.value).toBe(EVENT_ID);
  });

  it("削除対象の出来事がない場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, eventId: EVENT_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("出来事IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, deleteEventRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, eventId: "" })).rejects.toThrow("出来事IDが設定されていません。");
    expect(deleteEventRepository.deleteEvent).not.toHaveBeenCalled();
  });
});
