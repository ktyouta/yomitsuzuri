import { describe, expect, it, vi } from "vitest";
import { UpdateCharacterRelationUsecase } from "..";
import { CharacterId, CharacterRelationEntity, CharacterRelationId, CharacterRelationName, CharacterRelationUniquenessDomainService, CharacterValidityDomainService, WorkId, type ICharacterRelationUniquenessRepository, type ICharacterValidityRepository, type IUpdateCharacterRelationRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_RELATION_ID = "01BX5ZZKBKACTAV9WEVGEMMVR0";
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC0";
const TARGET_CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC1";
const NEW_CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC2";
const NEW_TARGET_CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC3";

const BODY = {
  characterId: NEW_CHARACTER_ID,
  targetCharacterId: NEW_TARGET_CHARACTER_ID,
  relationName: "弟",
};

type Options = {
  relationExists?: boolean;
  validCharacterIds?: string[];
  duplicatedIds?: { id: string, deleteFlg: boolean }[];
};

function createCharacterRelation() {
  return CharacterRelationEntity.reconstruct({
    id: CharacterRelationId.of(CHARACTER_RELATION_ID),
    workId: WorkId.of(WORK_ID),
    characterId: CharacterId.of(CHARACTER_ID),
    targetCharacterId: CharacterId.of(TARGET_CHARACTER_ID),
    relationName: CharacterRelationName.of("兄"),
    deleteFlg: false,
  });
}

function createUsecase({ relationExists = true, validCharacterIds = [NEW_CHARACTER_ID, NEW_TARGET_CHARACTER_ID], duplicatedIds = [] }: Options = {}) {
  const updateCharacterRelationRepository = {
    findCharacterRelation: vi.fn<IUpdateCharacterRelationRepository["findCharacterRelation"]>().mockResolvedValue(relationExists ? createCharacterRelation() : null),
    updateCharacterRelation: vi.fn<IUpdateCharacterRelationRepository["updateCharacterRelation"]>().mockResolvedValue(),
  } satisfies IUpdateCharacterRelationRepository;
  const characterValidityRepository = {
    findCharacters: vi.fn<ICharacterValidityRepository["findCharacters"]>().mockResolvedValue(validCharacterIds.map((id) => ({ id }))),
  } satisfies ICharacterValidityRepository;
  const uniquenessRepository = {
    findCharacterRelation: vi.fn<ICharacterRelationUniquenessRepository["findCharacterRelation"]>().mockResolvedValue(duplicatedIds),
  } satisfies ICharacterRelationUniquenessRepository;

  const usecase = new UpdateCharacterRelationUsecase(
    updateCharacterRelationRepository,
    new CharacterValidityDomainService(characterValidityRepository),
    new CharacterRelationUniquenessDomainService(uniquenessRepository),
  );

  return { usecase, updateCharacterRelationRepository, characterValidityRepository, uniquenessRepository };
}

describe("UpdateCharacterRelationUsecase", () => {
  it("人物・相手・関係名を置き換えて保存し、その内容を返すこと（ID・作品は変えない）", async () => {
    const { usecase, updateCharacterRelationRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID, body: BODY });

    expect(updateCharacterRelationRepository.updateCharacterRelation).toHaveBeenCalledTimes(1);
    const saved = updateCharacterRelationRepository.updateCharacterRelation.mock.calls[0]?.[0];
    expect(saved?.toSnapshot()).toEqual({
      id: CHARACTER_RELATION_ID,
      workId: WORK_ID,
      characterId: NEW_CHARACTER_ID,
      targetCharacterId: NEW_TARGET_CHARACTER_ID,
      relationName: "弟",
      deleteFlg: false,
    });

    expect(result._unsafeUnwrap().value).toEqual({
      id: CHARACTER_RELATION_ID,
      workId: WORK_ID,
      characterId: NEW_CHARACTER_ID,
      targetCharacterId: NEW_TARGET_CHARACTER_ID,
      relationName: "弟",
    });
  });

  it("人物の有効性と重複を、変更後の値で判定すること", async () => {
    const { usecase, characterValidityRepository, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID, body: BODY });

    const validated = characterValidityRepository.findCharacters.mock.calls[0]?.[1];
    expect(validated?.characterId.value).toBe(NEW_CHARACTER_ID);
    expect(validated?.targetCharacterId.value).toBe(NEW_TARGET_CHARACTER_ID);
    const checked = uniquenessRepository.findCharacterRelation.mock.calls[0]?.[1];
    expect(checked?.relationName.value).toBe("弟");
  });

  it("入力値の違反をすべて項目名付きで返し、DB を問い合わせないこと", async () => {
    const { usecase, updateCharacterRelationRepository, characterValidityRepository, uniquenessRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      characterRelationId: CHARACTER_RELATION_ID,
      body: { characterId: "", targetCharacterId: "", relationName: "" },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "characterId", error: { type: "CHARACTER_ID_EMPTY" } },
        { field: "targetCharacterId", error: { type: "CHARACTER_ID_EMPTY" } },
        { field: "relationName", error: { type: "CHARACTER_RELATION_NAME_EMPTY" } },
      ],
    });
    expect(updateCharacterRelationRepository.findCharacterRelation).not.toHaveBeenCalled();
    expect(characterValidityRepository.findCharacters).not.toHaveBeenCalled();
    expect(uniquenessRepository.findCharacterRelation).not.toHaveBeenCalled();
    expect(updateCharacterRelationRepository.updateCharacterRelation).not.toHaveBeenCalled();
  });

  it("登場人物関係が取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateCharacterRelationRepository } = createUsecase({ relationExists: false });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateCharacterRelationRepository.updateCharacterRelation).not.toHaveBeenCalled();
  });

  it("人物と相手が同じ場合、CHARACTER_RELATION_SELF を返し、保存しないこと", async () => {
    const { usecase, updateCharacterRelationRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      characterRelationId: CHARACTER_RELATION_ID,
      body: { ...BODY, targetCharacterId: NEW_CHARACTER_ID },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CHARACTER_RELATION_SELF" });
    expect(updateCharacterRelationRepository.updateCharacterRelation).not.toHaveBeenCalled();
  });

  it.each([
    { validCharacterIds: [NEW_TARGET_CHARACTER_ID], fields: ["characterId"] },
    { validCharacterIds: [NEW_CHARACTER_ID], fields: ["targetCharacterId"] },
    { validCharacterIds: [], fields: ["characterId", "targetCharacterId"] },
  ])("有効な登場人物が $validCharacterIds の場合、INVALID_CHARACTER（$fields）を返し、保存しないこと", async ({ validCharacterIds, fields }) => {
    const { usecase, updateCharacterRelationRepository } = createUsecase({ validCharacterIds });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_CHARACTER", fields });
    expect(updateCharacterRelationRepository.updateCharacterRelation).not.toHaveBeenCalled();
  });

  it("同じ2人の間に削除されていない同じ関係名の関係がある場合、DUPLICATE_RELATION を返し、保存しないこと", async () => {
    const { usecase, updateCharacterRelationRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVR1", deleteFlg: false }] });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_RELATION" });
    expect(updateCharacterRelationRepository.updateCharacterRelation).not.toHaveBeenCalled();
  });

  it("同じ2人の間に同じ関係名の関係が削除済みのものだけある場合、DUPLICATE_DELETED_RELATION を返し、保存しないこと", async () => {
    const { usecase, updateCharacterRelationRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVR1", deleteFlg: true }] });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_RELATION" });
    expect(updateCharacterRelationRepository.updateCharacterRelation).not.toHaveBeenCalled();
  });

  it("登場人物関係IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, updateCharacterRelationRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterRelationId: "", body: BODY })).rejects.toThrow("登場人物関係IDが設定されていません。");
    expect(updateCharacterRelationRepository.findCharacterRelation).not.toHaveBeenCalled();
  });
});
