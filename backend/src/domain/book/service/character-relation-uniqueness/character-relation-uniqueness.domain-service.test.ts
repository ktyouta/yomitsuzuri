import { describe, it, expect, vi } from "vitest";
import { UserId } from "../../../shared";
import {
  CharacterId,
  CharacterRelationEntity,
  CharacterRelationId,
  CharacterRelationName,
  CharacterRelationUniquenessDomainService,
  WorkId,
  type ICharacterRelationUniquenessRepository,
} from "../../..";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_RELATION = CharacterRelationEntity.reconstruct({
  id: CharacterRelationId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
  workId: WorkId.of("01ARZ3NDEKTSV4RRFFQ69G5FAW"),
  characterId: CharacterId.of("01ARZ3NDEKTSV4RRFFQ69G5FAX"),
  targetCharacterId: CharacterId.of("01ARZ3NDEKTSV4RRFFQ69G5FAY"),
  relationName: CharacterRelationName.of("兄"),
  deleteFlg: false,
});

function createRepository(result: { id: string }[]) {
  return {
    findCharacterRelation: vi.fn<ICharacterRelationUniquenessRepository["findCharacterRelation"]>().mockResolvedValue(result),
  } satisfies ICharacterRelationUniquenessRepository;
}

describe("CharacterRelationUniquenessDomainService", () => {
  it("重複する登場人物関係が1件以上ある場合、true を返すこと", async () => {
    const service = new CharacterRelationUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ" }]));

    expect(await service.isDuplicated(USER_ID, CHARACTER_RELATION)).toBe(true);
  });

  it("重複する登場人物関係が0件の場合、false を返すこと", async () => {
    const service = new CharacterRelationUniquenessDomainService(createRepository([]));

    expect(await service.isDuplicated(USER_ID, CHARACTER_RELATION)).toBe(false);
  });

  it("渡したユーザーID・登場人物関係で Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new CharacterRelationUniquenessDomainService(repository);

    await service.isDuplicated(USER_ID, CHARACTER_RELATION);

    expect(repository.findCharacterRelation).toHaveBeenCalledWith(USER_ID, CHARACTER_RELATION);
  });
});
