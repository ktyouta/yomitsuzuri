import { describe, expect, it, vi } from "vitest";
import { Timestamp, UserId, WorkId, type IHardDeleteWorkRepository } from "../../../../domain";
import { HardDeleteWorkUsecase } from "./hard-delete-work.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAX";

/** 作品の取得時点の更新日時 */
const WORK_UPDATED_AT = "2026-01-01T00:00:00.000Z";

const BODY = {
  updatedAt: WORK_UPDATED_AT,
};

type Options = {
  work?: { updatedAt: Timestamp } | null;
  deleted?: boolean;
};

function createUsecase({ work = { updatedAt: Timestamp.of(WORK_UPDATED_AT) }, deleted = true }: Options = {}) {
  const hardDeleteWorkRepository = {
    findWork: vi.fn<IHardDeleteWorkRepository["findWork"]>().mockResolvedValue(work),
    deleteWork: vi.fn<IHardDeleteWorkRepository["deleteWork"]>().mockResolvedValue(deleted),
  } satisfies IHardDeleteWorkRepository;

  const usecase = new HardDeleteWorkUsecase(hardDeleteWorkRepository);

  return { usecase, hardDeleteWorkRepository };
}

describe("HardDeleteWorkUsecase", () => {
  it("指定した作品を、画面の表示時点の更新日時を条件に1回物理削除し、ok を返すこと", async () => {
    const { usecase, hardDeleteWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result.isOk()).toBe(true);
    expect(hardDeleteWorkRepository.deleteWork).toHaveBeenCalledTimes(1);
    const [workId, expectedUpdatedAt] = hardDeleteWorkRepository.deleteWork.mock.calls[0] ?? [];
    expect(workId?.value).toBe(WORK_ID);
    expect(expectedUpdatedAt?.value).toBe(WORK_UPDATED_AT);
  });

  it("指定したユーザー・作品IDで物理削除の対象を取得すること", async () => {
    const { usecase, hardDeleteWorkRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(hardDeleteWorkRepository.findWork).toHaveBeenCalledWith(USER_ID, WorkId.of(WORK_ID));
  });

  it("物理削除の対象の作品が取得できない場合、NOT_FOUND を返し、削除しないこと", async () => {
    const { usecase, hardDeleteWorkRepository } = createUsecase({ work: null });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(hardDeleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("画面の表示時点の更新日時が取得時点と一致しない場合、CONFLICT_WORK を返し、削除しないこと", async () => {
    const { usecase, hardDeleteWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { updatedAt: "2025-11-01T00:00:00.000Z" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(hardDeleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("取得後に他の操作で復元・更新されていたため削除されなかった場合、CONFLICT_WORK を返すこと", async () => {
    const { usecase, hardDeleteWorkRepository } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CONFLICT_WORK" });
    expect(hardDeleteWorkRepository.deleteWork).toHaveBeenCalledTimes(1);
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反を項目名とともに返し、DB を問い合わせず削除しないこと", async () => {
    const { usecase, hardDeleteWorkRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { updatedAt: "2026-01-01" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "updatedAt", error: { type: "TIMESTAMP_INVALID" } },
      ],
    });
    expect(hardDeleteWorkRepository.findWork).not.toHaveBeenCalled();
    expect(hardDeleteWorkRepository.deleteWork).not.toHaveBeenCalled();
  });

  it("作品IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, hardDeleteWorkRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow("作品IDが設定されていません。");
    expect(hardDeleteWorkRepository.findWork).not.toHaveBeenCalled();
  });
});
