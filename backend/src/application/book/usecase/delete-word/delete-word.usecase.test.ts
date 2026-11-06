import { describe, it, expect, vi } from "vitest";
import { DeleteWordUsecase } from "..";
import { WordEntity, WordId, WordMemo, WordPage, WordText, WorkId, type IDeleteWordRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORD_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

function createWord() {
  return WordEntity.reconstruct({
    id: WordId.of(WORD_ID),
    workId: WorkId.of(WORK_ID),
    text: WordText.of("赤い手帳"),
    memo: WordMemo.of("メモ"),
    page: WordPage.of(42),
    deleteFlg: false,
  });
}

type Options = {
  wordExists?: boolean;
};

function createUsecase({ wordExists = true }: Options = {}) {
  const deleteWordRepository = {
    findWord: vi.fn<IDeleteWordRepository["findWord"]>().mockResolvedValue(wordExists ? createWord() : null),
    deleteWord: vi.fn<IDeleteWordRepository["deleteWord"]>().mockResolvedValue(),
  } satisfies IDeleteWordRepository;

  const usecase = new DeleteWordUsecase(deleteWordRepository);

  return { usecase, deleteWordRepository };
}

describe("DeleteWordUsecase", () => {
  it("気になるワードを削除済みにして1回保存し、ok を返すこと", async () => {
    const { usecase, deleteWordRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result.isOk()).toBe(true);
    expect(deleteWordRepository.deleteWord).toHaveBeenCalledTimes(1);
    const savedWord = deleteWordRepository.deleteWord.mock.calls[0]?.[0];
    expect(savedWord?.toSnapshot()).toEqual({
      id: WORD_ID,
      workId: WORK_ID,
      text: "赤い手帳",
      memo: "メモ",
      page: 42,
      deleteFlg: true,
    });
  });

  it("指定したユーザー・IDで気になるワードを取得すること", async () => {
    const { usecase, deleteWordRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    const [userId, wordId] = deleteWordRepository.findWord.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(wordId?.value).toBe(WORD_ID);
  });

  it("削除対象の気になるワードがない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, deleteWordRepository } = createUsecase({ wordExists: false });

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(deleteWordRepository.deleteWord).not.toHaveBeenCalled();
  });

  it("気になるワードIDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, deleteWordRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, wordId: "" })).rejects.toThrow("気になるワードIDが設定されていません。");
    expect(deleteWordRepository.findWord).not.toHaveBeenCalled();
    expect(deleteWordRepository.deleteWord).not.toHaveBeenCalled();
  });
});
