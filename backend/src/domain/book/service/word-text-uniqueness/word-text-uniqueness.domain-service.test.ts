import { describe, it, expect, vi } from "vitest";
import { UserId } from "../../../shared";
import { WordId, WordText, WordTextUniquenessDomainService, WorkId, type IWordTextUniquenessRepository } from "../../..";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = WorkId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const WORD_ID = WordId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
const WORD_TEXT = WordText.of("赤い手帳");

function createRepository(result: { id: string, deleteFlg: boolean }[]) {
  return {
    findWord: vi.fn<IWordTextUniquenessRepository["findWord"]>().mockResolvedValue(result),
  } satisfies IWordTextUniquenessRepository;
}

describe("WordTextUniquenessDomainService", () => {
  it("削除されていない同じワードがある場合、DUPLICATE_TEXT を返すこと", async () => {
    const service = new WordTextUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false }]));

    const result = await service.validate(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TEXT" });
  });

  it("削除済みの同じワードだけがある場合、DUPLICATE_DELETED_TEXT を返すこと", async () => {
    const service = new WordTextUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: true }]));

    const result = await service.validate(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_TEXT" });
  });

  it("削除済みと削除されていない同じワードの両方がある場合、DUPLICATE_TEXT を返すこと", async () => {
    const service = new WordTextUniquenessDomainService(createRepository([
      { id: "01HYYYYYYYYYYYYYYYYYYYYYYY", deleteFlg: true },
      { id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false },
    ]));

    const result = await service.validate(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_TEXT" });
  });

  it("同じワードが0件の場合、ok を返すこと", async () => {
    const service = new WordTextUniquenessDomainService(createRepository([]));

    const result = await service.validate(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);

    expect(result.isOk()).toBe(true);
  });

  it("渡したユーザーID・作品ID・気になるワードID・気になるワードで Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new WordTextUniquenessDomainService(repository);

    await service.validate(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);

    expect(repository.findWord).toHaveBeenCalledWith(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);
  });
});
