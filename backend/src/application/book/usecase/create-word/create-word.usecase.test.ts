import { describe, it, expect, vi } from "vitest";
import { CreateWordUsecase } from "..";
import { WordTextUniquenessDomainService, type ICreateWordRepository, type IWordTextUniquenessRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const BODY = {
  text: "赤い手帳",
  memo: "メモ",
  page: 42,
};

type Options = {
  workExists?: boolean;
  duplicatedIds?: { id: string }[];
};

function createUsecase({ workExists = true, duplicatedIds = [] }: Options = {}) {
  const createWordRepository = {
    findWork: vi.fn<ICreateWordRepository["findWork"]>().mockResolvedValue(workExists ? { id: WORK_ID } : null),
    createWord: vi.fn<ICreateWordRepository["createWord"]>().mockResolvedValue(),
  } satisfies ICreateWordRepository;
  const uniquenessRepository = {
    findWord: vi.fn<IWordTextUniquenessRepository["findWord"]>().mockResolvedValue(duplicatedIds),
  } satisfies IWordTextUniquenessRepository;

  const usecase = new CreateWordUsecase(
    createWordRepository,
    new WordTextUniquenessDomainService(uniquenessRepository),
  );

  return { usecase, createWordRepository, uniquenessRepository };
}

describe("CreateWordUsecase", () => {
  it("指定した作品に気になるワードを保存し、その内容を返すこと", async () => {
    const { usecase, createWordRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(createWordRepository.createWord).toHaveBeenCalledTimes(1);
    const savedWord = createWordRepository.createWord.mock.calls[0]?.[0];
    expect(savedWord?.toSnapshot()).toEqual({
      id: expect.stringMatching(ULID_PATTERN),
      workId: WORK_ID,
      text: "赤い手帳",
      memo: "メモ",
      page: 42,
      deleteFlg: false,
    });

    expect(result._unsafeUnwrap().value).toEqual({
      id: savedWord?.id.value,
      workId: WORK_ID,
      text: "赤い手帳",
      memo: "メモ",
      page: 42,
    });
  });

  it("ワード以外が未指定の場合、null で保存されること", async () => {
    const { usecase, createWordRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { text: "赤い手帳" } });

    const snapshot = createWordRepository.createWord.mock.calls[0]?.[0].toSnapshot();
    expect(snapshot?.memo).toBeNull();
    expect(snapshot?.page).toBeNull();
  });

  it("作品が取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, createWordRepository } = createUsecase({ workExists: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(createWordRepository.createWord).not.toHaveBeenCalled();
  });

  it("作品内に同じワードが存在する場合、DUPLICATE_TEXT を返し、保存しないこと", async () => {
    const { usecase, createWordRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVT0" }] });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TEXT" });
    expect(createWordRepository.createWord).not.toHaveBeenCalled();
  });

  it("指定したユーザー・作品IDで作品を問い合わせ、ユーザー・作品ID・ワードで同じワードを問い合わせること", async () => {
    const { usecase, createWordRepository, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { ...BODY, text: "  赤い手帳  " } });

    const [workUserId, workId] = createWordRepository.findWork.mock.calls[0] ?? [];
    expect(workUserId).toBe(USER_ID);
    expect(workId?.value).toBe(WORK_ID);
    const [userId, uniquenessWorkId, , wordText] = uniquenessRepository.findWord.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(uniquenessWorkId?.value).toBe(WORK_ID);
    expect(wordText?.value).toBe("赤い手帳");
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, createWordRepository, uniquenessRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID,
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
    expect(createWordRepository.findWork).not.toHaveBeenCalled();
    expect(uniquenessRepository.findWord).not.toHaveBeenCalled();
    expect(createWordRepository.createWord).not.toHaveBeenCalled();
  });

  it("違反している項目だけを INVALID_INPUT で返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { ...BODY, text: "   " } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "text", error: { type: "WORD_EMPTY" } }],
    });
  });

  it("作品IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, createWordRepository, uniquenessRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow("作品IDが設定されていません。");
    expect(createWordRepository.findWork).not.toHaveBeenCalled();
    expect(uniquenessRepository.findWord).not.toHaveBeenCalled();
    expect(createWordRepository.createWord).not.toHaveBeenCalled();
  });
});
