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

function createRepository(result: { id: string, deleteFlg: boolean }[]) {
  return {
    findCharacterRelation: vi.fn<ICharacterRelationUniquenessRepository["findCharacterRelation"]>().mockResolvedValue(result),
  } satisfies ICharacterRelationUniquenessRepository;
}

describe("CharacterRelationUniquenessDomainService", () => {
  it("削除されていない重複する登場人物関係がある場合、DUPLICATE_RELATION を返すこと", async () => {
    const service = new CharacterRelationUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false }]));

    const result = await service.validate(USER_ID, CHARACTER_RELATION);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_RELATION" });
  });

  it("削除済みの重複する登場人物関係だけがある場合、DUPLICATE_DELETED_RELATION を返すこと", async () => {
    const service = new CharacterRelationUniquenessDomainService(createRepository([{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: true }]));

    const result = await service.validate(USER_ID, CHARACTER_RELATION);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_RELATION" });
  });

  it("削除済みと削除されていない重複する登場人物関係の両方がある場合、DUPLICATE_RELATION を返すこと", async () => {
    const service = new CharacterRelationUniquenessDomainService(createRepository([
      { id: "01HYYYYYYYYYYYYYYYYYYYYYYY", deleteFlg: true },
      { id: "01HZZZZZZZZZZZZZZZZZZZZZZZ", deleteFlg: false },
    ]));

    const result = await service.validate(USER_ID, CHARACTER_RELATION);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_RELATION" });
  });

  it("重複する登場人物関係が0件の場合、ok を返すこと", async () => {
    const service = new CharacterRelationUniquenessDomainService(createRepository([]));

    const result = await service.validate(USER_ID, CHARACTER_RELATION);

    expect(result.isOk()).toBe(true);
  });

  it("渡したユーザーID・登場人物関係で Repository に問い合わせること", async () => {
    const repository = createRepository([]);
    const service = new CharacterRelationUniquenessDomainService(repository);

    await service.validate(USER_ID, CHARACTER_RELATION);

    expect(repository.findCharacterRelation).toHaveBeenCalledWith(USER_ID, CHARACTER_RELATION);
  });
});
