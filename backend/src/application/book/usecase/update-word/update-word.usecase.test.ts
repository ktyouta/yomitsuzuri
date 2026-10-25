import { describe, it, expect, vi } from "vitest";
import { UpdateWordUsecase } from "..";
import { WordEntity, WordId, WordMemo, WordPage, WordText, WordTextUniquenessDomainService, WorkId, type IUpdateWordRepository, type IWordTextUniquenessRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORD_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

const BODY = {
  text: "青い封筒",
  memo: "更新後のメモ",
  page: 120,
};

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
  duplicatedIds?: { id: string }[];
};

function createUsecase({ wordExists = true, duplicatedIds = [] }: Options = {}) {
  const updateWordRepository = {
    findWord: vi.fn<IUpdateWordRepository["findWord"]>().mockResolvedValue(wordExists ? createWord() : null),
    updateWord: vi.fn<IUpdateWordRepository["updateWord"]>().mockResolvedValue(),
  } satisfies IUpdateWordRepository;
  const uniquenessRepository = {
    findWord: vi.fn<IWordTextUniquenessRepository["findWord"]>().mockResolvedValue(duplicatedIds),
  } satisfies IWordTextUniquenessRepository;

  const usecase = new UpdateWordUsecase(
    updateWordRepository,
    new WordTextUniquenessDomainService(uniquenessRepository),
  );

  return { usecase, updateWordRepository, uniquenessRepository };
}

describe("UpdateWordUsecase", () => {
  it("気になるワードを更新内容で保存し、その内容を返すこと", async () => {
    const { usecase, updateWordRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID, body: BODY });

    expect(updateWordRepository.updateWord).toHaveBeenCalledTimes(1);
    const savedWord = updateWordRepository.updateWord.mock.calls[0]?.[0];
    expect(savedWord?.toSnapshot()).toEqual({
      id: WORD_ID,
      workId: WORK_ID,
      text: "青い封筒",
      memo: "更新後のメモ",
      page: 120,
      deleteFlg: false,
    });

    expect(result._unsafeUnwrap().value).toEqual({
      id: WORD_ID,
      workId: WORK_ID,
      text: "青い封筒",
      memo: "更新後のメモ",
      page: 120,
    });
  });

  it("ワード以外が未指定の場合、null で保存されること", async () => {
    const { usecase, updateWordRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, wordId: WORD_ID, body: { text: "青い封筒" } });

    const snapshot = updateWordRepository.updateWord.mock.calls[0]?.[0].toSnapshot();
    expect(snapshot?.memo).toBeNull();
    expect(snapshot?.page).toBeNull();
  });

  it("指定したユーザー・IDで気になるワードを問い合わせ、その作品・自身のID・ワードで同じワードを問い合わせること", async () => {
    const { usecase, updateWordRepository, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, wordId: WORD_ID, body: { ...BODY, text: "  青い封筒  " } });

    const [findUserId, findWordId] = updateWordRepository.findWord.mock.calls[0] ?? [];
    expect(findUserId).toBe(USER_ID);
    expect(findWordId?.value).toBe(WORD_ID);
    const [userId, workId, wordId, wordText] = uniquenessRepository.findWord.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(workId?.value).toBe(WORK_ID);
    expect(wordId?.value).toBe(WORD_ID);
    expect(wordText?.value).toBe("青い封筒");
  });

  it("気になるワードが取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateWordRepository } = createUsecase({ wordExists: false });

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateWordRepository.updateWord).not.toHaveBeenCalled();
  });

  it("作品内に自身以外の同じワードが存在する場合、DUPLICATE_TEXT を返し、保存しないこと", async () => {
    const { usecase, updateWordRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVT1" }] });

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TEXT" });
    expect(updateWordRepository.updateWord).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, updateWordRepository, uniquenessRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      wordId: WORD_ID,
      body: {
        text: "   ",
        memo: "あ".repeat(2001),
        page: 0,
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "text", error: { type: "WORD_EMPTY" } },
        { field: "memo", error: { type: "WORD_MEMO_TOO_LONG", max: 2000 } },
        { field: "page", error: { type: "WORD_PAGE_INVALID", min: 1 } },
      ],
    });
    expect(updateWordRepository.findWord).not.toHaveBeenCalled();
    expect(uniquenessRepository.findWord).not.toHaveBeenCalled();
    expect(updateWordRepository.updateWord).not.toHaveBeenCalled();
  });

  it("違反している項目だけを INVALID_INPUT で返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, wordId: WORD_ID, body: { ...BODY, text: "   " } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "text", error: { type: "WORD_EMPTY" } }],
    });
  });

  it("気になるワードIDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, updateWordRepository, uniquenessRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, wordId: "", body: BODY })).rejects.toThrow("気になるワードIDが設定されていません。");
    expect(updateWordRepository.findWord).not.toHaveBeenCalled();
    expect(uniquenessRepository.findWord).not.toHaveBeenCalled();
    expect(updateWordRepository.updateWord).not.toHaveBeenCalled();
  });
});
