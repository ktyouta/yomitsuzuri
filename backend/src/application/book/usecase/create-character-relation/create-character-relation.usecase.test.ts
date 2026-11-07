import { describe, expect, it, vi } from "vitest";
import { CreateCharacterRelationUsecase } from "..";
import { CharacterRelationUniquenessDomainService, CharacterValidityDomainService, type ICharacterRelationUniquenessRepository, type ICharacterValidityRepository, type ICreateCharacterRelationRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC0";
const TARGET_CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVC1";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const BODY = {
  characterId: CHARACTER_ID,
  targetCharacterId: TARGET_CHARACTER_ID,
  relationName: "兄",
};

type Options = {
  workExists?: boolean;
  validCharacterIds?: string[];
  duplicatedIds?: { id: string, deleteFlg: boolean }[];
};

function createUsecase({ workExists = true, validCharacterIds = [CHARACTER_ID, TARGET_CHARACTER_ID], duplicatedIds = [] }: Options = {}) {
  const createCharacterRelationRepository = {
    findWork: vi.fn<ICreateCharacterRelationRepository["findWork"]>().mockResolvedValue(workExists ? { id: WORK_ID } : null),
    createCharacterRelation: vi.fn<ICreateCharacterRelationRepository["createCharacterRelation"]>().mockResolvedValue(),
  } satisfies ICreateCharacterRelationRepository;
  const characterValidityRepository = {
    findCharacters: vi.fn<ICharacterValidityRepository["findCharacters"]>().mockResolvedValue(validCharacterIds.map((id) => ({ id }))),
  } satisfies ICharacterValidityRepository;
  const uniquenessRepository = {
    findCharacterRelation: vi.fn<ICharacterRelationUniquenessRepository["findCharacterRelation"]>().mockResolvedValue(duplicatedIds),
  } satisfies ICharacterRelationUniquenessRepository;

  const usecase = new CreateCharacterRelationUsecase(
    createCharacterRelationRepository,
    new CharacterValidityDomainService(characterValidityRepository),
    new CharacterRelationUniquenessDomainService(uniquenessRepository),
  );

  return { usecase, createCharacterRelationRepository, characterValidityRepository, uniquenessRepository };
}

describe("CreateCharacterRelationUsecase", () => {
  it("指定した作品に登場人物関係を保存し、その内容を返すこと", async () => {
    const { usecase, createCharacterRelationRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(createCharacterRelationRepository.createCharacterRelation).toHaveBeenCalledTimes(1);
    const saved = createCharacterRelationRepository.createCharacterRelation.mock.calls[0]?.[0];
    expect(saved?.toSnapshot()).toEqual({
      id: expect.stringMatching(ULID_PATTERN),
      workId: WORK_ID,
      characterId: CHARACTER_ID,
      targetCharacterId: TARGET_CHARACTER_ID,
      relationName: "兄",
      deleteFlg: false,
    });

    expect(result._unsafeUnwrap().value).toEqual({
      id: saved?.id.value,
      workId: WORK_ID,
      characterId: CHARACTER_ID,
      targetCharacterId: TARGET_CHARACTER_ID,
      relationName: "兄",
    });
  });

  it("入力値の違反をすべて項目名付きで返し、DB を問い合わせないこと", async () => {
    const { usecase, createCharacterRelationRepository, characterValidityRepository, uniquenessRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID,
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
    expect(createCharacterRelationRepository.findWork).not.toHaveBeenCalled();
    expect(characterValidityRepository.findCharacters).not.toHaveBeenCalled();
    expect(uniquenessRepository.findCharacterRelation).not.toHaveBeenCalled();
    expect(createCharacterRelationRepository.createCharacterRelation).not.toHaveBeenCalled();
  });

  it("作品が取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, createCharacterRelationRepository } = createUsecase({ workExists: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(createCharacterRelationRepository.createCharacterRelation).not.toHaveBeenCalled();
  });

  it("人物と相手が同じ場合、CHARACTER_RELATION_SELF を返し、保存しないこと", async () => {
    const { usecase, createCharacterRelationRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID,
      body: { ...BODY, targetCharacterId: CHARACTER_ID },
    });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CHARACTER_RELATION_SELF" });
    expect(createCharacterRelationRepository.createCharacterRelation).not.toHaveBeenCalled();
  });

  it.each([
    { validCharacterIds: [TARGET_CHARACTER_ID], fields: ["characterId"] },
    { validCharacterIds: [CHARACTER_ID], fields: ["targetCharacterId"] },
    { validCharacterIds: [], fields: ["characterId", "targetCharacterId"] },
  ])("有効な登場人物が $validCharacterIds の場合、INVALID_CHARACTER（$fields）を返し、保存しないこと", async ({ validCharacterIds, fields }) => {
    const { usecase, createCharacterRelationRepository } = createUsecase({ validCharacterIds });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_CHARACTER", fields });
    expect(createCharacterRelationRepository.createCharacterRelation).not.toHaveBeenCalled();
  });

  it("同じ2人の間に削除されていない同じ関係名の関係がある場合、DUPLICATE_RELATION を返し、保存しないこと", async () => {
    const { usecase, createCharacterRelationRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVR0", deleteFlg: false }] });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_RELATION" });
    expect(createCharacterRelationRepository.createCharacterRelation).not.toHaveBeenCalled();
  });

  it("同じ2人の間に同じ関係名の関係が削除済みのものだけある場合、DUPLICATE_DELETED_RELATION を返し、保存しないこと", async () => {
    const { usecase, createCharacterRelationRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVR0", deleteFlg: true }] });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_DELETED_RELATION" });
    expect(createCharacterRelationRepository.createCharacterRelation).not.toHaveBeenCalled();
  });

  it("workId が空の場合は throw し、DB を問い合わせないこと", async () => {
    const { usecase, createCharacterRelationRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow();
    expect(createCharacterRelationRepository.findWork).not.toHaveBeenCalled();
  });
});
