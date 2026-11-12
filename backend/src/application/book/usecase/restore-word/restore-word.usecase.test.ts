import { describe, it, expect, vi } from "vitest";
import { RestoreWordUsecase } from "..";
import { UserId, WordEntity, WordId, WordMemo, WordPage, WordText, WorkId, type IRestoreWordRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const WORD_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

/**
 * 削除済みの気になるワード
 */
function createDeletedWord() {
  return WordEntity.reconstruct({
    id: WordId.of(WORD_ID),
    workId: WorkId.of(WORK_ID),
    text: WordText.of("赤い手帳"),
    memo: WordMemo.of("メモ"),
    page: WordPage.of(42),
    deleteFlg: true,
  });
}

type Options = {
  wordExists?: boolean;
};

function createUsecase({ wordExists = true }: Options = {}) {
  const restoreWordRepository = {
    findWord: vi.fn<IRestoreWordRepository["findWord"]>().mockResolvedValue(wordExists ? createDeletedWord() : null),
    restoreWord: vi.fn<IRestoreWordRepository["restoreWord"]>().mockResolvedValue(),
  } satisfies IRestoreWordRepository;

  const usecase = new RestoreWordUsecase(restoreWordRepository);

  return { usecase, restoreWordRepository };
}

const EXPECTED_VALUE = {
  id: WORD_ID,
  workId: WORK_ID,
  text: "赤い手帳",
  memo: "メモ",
  page: 42,
};

describe("RestoreWordUsecase", () => {
  it("気になるワードの削除済みを解除して1回保存し、復元した気になるワードを返すこと", async () => {
    const { usecase, restoreWordRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result._unsafeUnwrap().value).toEqual(EXPECTED_VALUE);
    expect(restoreWordRepository.restoreWord).toHaveBeenCalledTimes(1);
    const savedWord = restoreWordRepository.restoreWord.mock.calls[0]?.[0];
    expect(savedWord?.toSnapshot()).toEqual({ ...EXPECTED_VALUE, deleteFlg: false });
  });

  it("指定したユーザー・IDで気になるワードを問い合わせること", async () => {
    const { usecase, restoreWordRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    const [userId, wordId] = restoreWordRepository.findWord.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(wordId?.value).toBe(WORD_ID);
  });

  it("削除済みの気になるワードがない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, restoreWordRepository } = createUsecase({ wordExists: false });

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(restoreWordRepository.restoreWord).not.toHaveBeenCalled();
  });

  it("気になるワードIDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, restoreWordRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, wordId: "" })).rejects.toThrow("気になるワードIDが設定されていません。");
    expect(restoreWordRepository.findWord).not.toHaveBeenCalled();
    expect(restoreWordRepository.restoreWord).not.toHaveBeenCalled();
  });
});
