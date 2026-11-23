import { describe, expect, it, vi } from "vitest";
import { UserId, WordId, type IHardDeleteWordRepository } from "../../../../domain";
import { HardDeleteWordUsecase } from "./hard-delete-word.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORD_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAY";

type Options = {
  deleted?: boolean;
};

function createUsecase({ deleted = true }: Options = {}) {
  const hardDeleteWordRepository = {
    deleteWord: vi.fn<IHardDeleteWordRepository["deleteWord"]>().mockResolvedValue(deleted),
  } satisfies IHardDeleteWordRepository;

  const usecase = new HardDeleteWordUsecase(hardDeleteWordRepository);

  return { usecase, hardDeleteWordRepository };
}

describe("HardDeleteWordUsecase", () => {
  it("指定したユーザー・気になるワードIDで1回物理削除し、ok を返すこと", async () => {
    const { usecase, hardDeleteWordRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result.isOk()).toBe(true);
    expect(hardDeleteWordRepository.deleteWord).toHaveBeenCalledTimes(1);
    expect(hardDeleteWordRepository.deleteWord).toHaveBeenCalledWith(USER_ID, WordId.of(WORD_ID));
  });

  it("削除済みの気になるワードがなく削除されなかった場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("気になるワードIDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, hardDeleteWordRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, wordId: "" })).rejects.toThrow("気になるワードIDが設定されていません。");
    expect(hardDeleteWordRepository.deleteWord).not.toHaveBeenCalled();
  });
});
