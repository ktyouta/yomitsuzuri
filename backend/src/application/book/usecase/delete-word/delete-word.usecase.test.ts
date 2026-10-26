import { describe, it, expect, vi } from "vitest";
import { DeleteWordUsecase } from "..";
import type { IDeleteWordRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORD_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

type Options = {
  deleted?: boolean;
};

function createUsecase({ deleted = true }: Options = {}) {
  const deleteWordRepository = {
    deleteWord: vi.fn<IDeleteWordRepository["deleteWord"]>().mockResolvedValue(deleted),
  } satisfies IDeleteWordRepository;

  const usecase = new DeleteWordUsecase(deleteWordRepository);

  return { usecase, deleteWordRepository };
}

describe("DeleteWordUsecase", () => {
  it("気になるワードを削除できた場合、ok を返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result.isOk()).toBe(true);
  });

  it("指定したユーザー・IDで気になるワードを1回削除すること", async () => {
    const { usecase, deleteWordRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(deleteWordRepository.deleteWord).toHaveBeenCalledTimes(1);
    const [userId, wordId] = deleteWordRepository.deleteWord.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(wordId?.value).toBe(WORD_ID);
  });

  it("削除対象の気になるワードがない場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("気になるワードIDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, deleteWordRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, wordId: "" })).rejects.toThrow("気になるワードIDが設定されていません。");
    expect(deleteWordRepository.deleteWord).not.toHaveBeenCalled();
  });
});
