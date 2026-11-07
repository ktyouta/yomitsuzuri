import { describe, it, expect, vi } from "vitest";
import { UserId } from "../../../shared";
import { CharacterId, CharacterName, CharacterNameUniquenessDomainService, WorkId, type ICharacterNameUniquenessRepository } from "../../..";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = WorkId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW");
const CHARACTER_ID = CharacterId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
const CHARACTER_NAME = CharacterName.of("テスト人物");

function createRepository(result: { id: string, deleteFlg: boolean }[]) {
  return {
    findCharacter: vi.fn<ICharacterNameUniquenessRepository["findCharacter"]>().mockResolvedValue(result),
  } satisfies ICharacterNameUniquenessRepository;
}

describe("CharacterNameUniquenessDomainService", () => {
  it("削除されていない同名登場人物がある場合、DUPLICATE_NAME を返すこと", async () => {
    const service = new CharacterNameUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false }]));

    const result = await service.validate(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
  });

  it("削除済みの同名登場人物だけがある場合、DUPLICATE_DELETED_NAME を返すこと", async () => {
    const service = new CharacterNameUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: true }]));

    const result = await service.validate(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_NAME" });
  });

  it("削除済みと削除されていない同名登場人物の両方がある場合、DUPLICATE_NAME を返すこと", async () => {
    const service = new CharacterNameUniquenessDomainService(createRepository([
      { id: "01HYYYYYYYYYYYYYYYYYYYYYYY", deleteFlg: true },
      { id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false },
    ]));

    const result = await service.validate(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
  });

  it("同名登場人物が0件の場合、ok を返すこと", async () => {
    const service = new CharacterNameUniquenessDomainService(createRepository([]));

    const result = await service.validate(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);

    expect(result.isOk()).toBe(true);
  });

  it("渡したユーザーID・作品ID・登場人物ID・登場人物名で Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new CharacterNameUniquenessDomainService(repository);

    await service.validate(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);

    expect(repository.findCharacter).toHaveBeenCalledWith(USER_ID, WORK_ID, CHARACTER_ID, CHARACTER_NAME);
  });
});
