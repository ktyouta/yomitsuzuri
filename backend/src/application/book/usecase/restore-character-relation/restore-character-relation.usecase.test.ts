import { describe, expect, it, vi } from "vitest";
import { RestoreCharacterRelationUsecase } from "..";
import { CharacterId, CharacterRelationEntity, CharacterRelationId, CharacterRelationName, CharacterValidityDomainService, UserId, WorkId, type ICharacterValidityRepository, type IRestoreCharacterRelationRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_RELATION_ID = "01BX5ZZKBKACTAV9WEVGEMMVR0";
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC0";
const TARGET_CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC1";

type Options = {
  relationExists?: boolean;
  validCharacterIds?: string[];
};

/**
 * 削除済みの登場人物関係
 */
function createDeletedCharacterRelation() {
  return CharacterRelationEntity.reconstruct({
    id: CharacterRelationId.of(CHARACTER_RELATION_ID),
    workId: WorkId.of(WORK_ID),
    characterId: CharacterId.of(CHARACTER_ID),
    targetCharacterId: CharacterId.of(TARGET_CHARACTER_ID),
    relationName: CharacterRelationName.of("兄"),
    deleteFlg: true,
  });
}

function createUsecase({ relationExists = true, validCharacterIds = [CHARACTER_ID, TARGET_CHARACTER_ID] }: Options = {}) {
  const restoreCharacterRelationRepository = {
    findCharacterRelation: vi.fn<IRestoreCharacterRelationRepository["findCharacterRelation"]>().mockResolvedValue(relationExists ? createDeletedCharacterRelation() : null),
    restoreCharacterRelation: vi.fn<IRestoreCharacterRelationRepository["restoreCharacterRelation"]>().mockResolvedValue(),
  } satisfies IRestoreCharacterRelationRepository;
  const characterValidityRepository = {
    findCharacters: vi.fn<ICharacterValidityRepository["findCharacters"]>().mockResolvedValue(validCharacterIds.map((id) => ({ id }))),
  } satisfies ICharacterValidityRepository;

  const usecase = new RestoreCharacterRelationUsecase(
    restoreCharacterRelationRepository,
    new CharacterValidityDomainService(characterValidityRepository),
  );

  return { usecase, restoreCharacterRelationRepository, characterValidityRepository };
}

const EXPECTED_VALUE = {
  id: CHARACTER_RELATION_ID,
  workId: WORK_ID,
  characterId: CHARACTER_ID,
  targetCharacterId: TARGET_CHARACTER_ID,
  relationName: "兄",
};

describe("RestoreCharacterRelationUsecase", () => {
  it("登場人物関係の削除済みを解除して1回保存し、復元した登場人物関係を返すこと", async () => {
    const { usecase, restoreCharacterRelationRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result._unsafeUnwrap().value).toEqual(EXPECTED_VALUE);
    expect(restoreCharacterRelationRepository.restoreCharacterRelation).toHaveBeenCalledTimes(1);
    const saved = restoreCharacterRelationRepository.restoreCharacterRelation.mock.calls[0]?.[0];
    expect(saved?.toSnapshot()).toEqual({ ...EXPECTED_VALUE, deleteFlg: false });
  });

  it("指定したユーザー・IDで登場人物関係を問い合わせ、その関係の人物・相手で有効性を判定すること", async () => {
    const { usecase, restoreCharacterRelationRepository, characterValidityRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    const [userId, characterRelationId] = restoreCharacterRelationRepository.findCharacterRelation.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(characterRelationId?.value).toBe(CHARACTER_RELATION_ID);
    const [validatedUserId, validated] = characterValidityRepository.findCharacters.mock.calls[0] ?? [];
    expect(validatedUserId).toBe(USER_ID);
    expect(validated?.characterId.value).toBe(CHARACTER_ID);
    expect(validated?.targetCharacterId.value).toBe(TARGET_CHARACTER_ID);
  });

  it("削除済みの登場人物関係がない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, restoreCharacterRelationRepository, characterValidityRepository } = createUsecase({ relationExists: false });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(characterValidityRepository.findCharacters).not.toHaveBeenCalled();
    expect(restoreCharacterRelationRepository.restoreCharacterRelation).not.toHaveBeenCalled();
  });

  it.each([
    { validCharacterIds: [TARGET_CHARACTER_ID], label: "人物" },
    { validCharacterIds: [CHARACTER_ID], label: "相手" },
    { validCharacterIds: [], label: "人物と相手" },
  ])("$label が有効な登場人物ではない場合、DELETED_CHARACTER を返し、保存しないこと", async ({ validCharacterIds }) => {
    const { usecase, restoreCharacterRelationRepository } = createUsecase({ validCharacterIds });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DELETED_CHARACTER" });
    expect(restoreCharacterRelationRepository.restoreCharacterRelation).not.toHaveBeenCalled();
  });

  it("登場人物関係IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, restoreCharacterRelationRepository, characterValidityRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterRelationId: "" })).rejects.toThrow("登場人物関係IDが設定されていません。");
    expect(restoreCharacterRelationRepository.findCharacterRelation).not.toHaveBeenCalled();
    expect(characterValidityRepository.findCharacters).not.toHaveBeenCalled();
    expect(restoreCharacterRelationRepository.restoreCharacterRelation).not.toHaveBeenCalled();
  });
});
