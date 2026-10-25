import { describe, it, expect, vi } from "vitest";
import { UserId } from "../../../shared";
import { WordId, WordText, WordTextUniquenessDomainService, WorkId, type IWordTextUniquenessRepository } from "../../..";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = WorkId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const WORD_ID = WordId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
const WORD_TEXT = WordText.of("赤い手帳");

function createRepository(result: { id: string }[]) {
  return {
    findWord: vi.fn<IWordTextUniquenessRepository["findWord"]>().mockResolvedValue(result),
  } satisfies IWordTextUniquenessRepository;
}

describe("WordTextUniquenessDomainService", () => {
  it("同じワードが1件以上ある場合、true を返すこと", async () => {
    const service = new WordTextUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ" }]));

    expect(await service.isDuplicated(USER_ID, WORK_ID, WORD_ID, WORD_TEXT)).toBe(true);
  });

  it("同じワードが0件の場合、false を返すこと", async () => {
    const service = new WordTextUniquenessDomainService(createRepository([]));

    expect(await service.isDuplicated(USER_ID, WORK_ID, WORD_ID, WORD_TEXT)).toBe(false);
  });

  it("渡したユーザーID・作品ID・気になるワードID・気になるワードで Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new WordTextUniquenessDomainService(repository);

    await service.isDuplicated(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);

    expect(repository.findWord).toHaveBeenCalledWith(USER_ID, WORK_ID, WORD_ID, WORD_TEXT);
  });
});
