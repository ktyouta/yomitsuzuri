import { describe, expect, it, vi } from "vitest";
import { UserId } from "../../../shared";
import {
  CharacterId,
  CharacterRelationEntity,
  CharacterRelationId,
  CharacterRelationName,
  CharacterValidityDomainService,
  WorkId,
  type ICharacterValidityRepository,
} from "../../..";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAX";
const TARGET_CHARACTER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAY";
const CHARACTER_RELATION = CharacterRelationEntity.reconstruct({
  id: CharacterRelationId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
  workId: WorkId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW"),
  characterId: CharacterId.of(CHARACTER_ID),
  targetCharacterId: CharacterId.of(TARGET_CHARACTER_ID),
  relationName: CharacterRelationName.of("兄"),
  deleteFlg: false,
});

function createRepository(foundIds: string[]) {
  return {
    findCharacters: vi.fn<ICharacterValidityRepository["findCharacters"]>().mockResolvedValue(foundIds.map((id) => ({ id }))),
  } satisfies ICharacterValidityRepository;
}

describe("CharacterValidityDomainService", () => {
  it.each([
    { foundIds: [CHARACTER_ID, TARGET_CHARACTER_ID], expected: [] },
    { foundIds: [TARGET_CHARACTER_ID], expected: ["characterId"] },
    { foundIds: [CHARACTER_ID], expected: ["targetCharacterId"] },
    { foundIds: [], expected: ["characterId", "targetCharacterId"] },
  ])("取得できた登場人物が $foundIds の場合、$expected を返すこと", async ({ foundIds, expected }) => {
    const service = new CharacterValidityDomainService(createRepository(foundIds));

    expect(await service.findInvalidFields(USER_ID, CHARACTER_RELATION)).toEqual(expected);
  });

  it("渡したユーザーと登場人物関係で Repository に問い合わせること", async () => {
    const repository = createRepository([CHARACTER_ID, TARGET_CHARACTER_ID]);
    const service = new CharacterValidityDomainService(repository);

    await service.findInvalidFields(USER_ID, CHARACTER_RELATION);

    expect(repository.findCharacters).toHaveBeenCalledWith(USER_ID, CHARACTER_RELATION);
  });
});
