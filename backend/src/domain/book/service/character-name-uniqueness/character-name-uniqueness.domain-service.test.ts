import { describe, it, expect, vi } from "vitest";
import { UserId } from "../../../shared";
import { CharacterId, CharacterName, CharacterNameUniquenessDomainService, WorkId, type ICharacterNameUniquenessRepository } from "../../..";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = WorkId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const CHARACTER_ID = CharacterId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
const CHARACTER_NAME = CharacterName.of("テスト人物");

function createRepository(result: { id: string }[]) {
  return {
    findCharacter: vi.fn<ICharacterNameUniquenessRepository["findCharacter"]>().mockResolvedValue(result),
  } satisfies ICharacterNameUniquenessRepository;
}

describe("CharacterNameUniquenessDomainService", () => {
  it("同名登場人物が1件以上ある場合、true を返すこと", async () => {
    const service = new CharacterNameUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ" }]));

    expect(await service.isDuplicated(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME)).toBe(true);
  });

  it("同名登場人物が0件の場合、false を返すこと", async () => {
    const service = new CharacterNameUniquenessDomainService(createRepository([]));

    expect(await service.isDuplicated(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME)).toBe(false);
  });

  it("渡したユーザーID・作品ID・登場人物ID・登場人物名で Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new CharacterNameUniquenessDomainService(repository);

    await service.isDuplicated(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);

    expect(repository.findCharacter).toHaveBeenCalledWith(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);
  });
});
