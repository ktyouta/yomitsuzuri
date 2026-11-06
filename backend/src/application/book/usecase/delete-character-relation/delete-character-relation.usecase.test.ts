import { describe, expect, it, vi } from "vitest";
import { DeleteCharacterRelationUsecase } from "..";
import { CharacterId, CharacterRelationEntity, CharacterRelationId, CharacterRelationName, WorkId, type IDeleteCharacterRelationRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_RELATION_ID = "01BX5ZZKBKACTAV9WEVGEMMVR0";
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";
const TARGET_CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVT1";

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

type Options = {
  relationExists?: boolean;
};

function createUsecase({ relationExists = true }: Options = {}) {
  const deleteCharacterRelationRepository = {
    findCharacterRelation: vi.fn<IDeleteCharacterRelationRepository["findCharacterRelation"]>()
      .mockResolvedValue(relationExists ? createCharacterRelation() : null),
    deleteCharacterRelation: vi.fn<IDeleteCharacterRelationRepository["deleteCharacterRelation"]>().mockResolvedValue(),
  } satisfies IDeleteCharacterRelationRepository;

  const usecase = new DeleteCharacterRelationUsecase(deleteCharacterRelationRepository);

  return { usecase, deleteCharacterRelationRepository };
}

describe("DeleteCharacterRelationUsecase", () => {
  it("登場人物関係を削除済みにして1回保存し、ok を返すこと", async () => {
    const { usecase, deleteCharacterRelationRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result.isOk()).toBe(true);
    expect(deleteCharacterRelationRepository.deleteCharacterRelation).toHaveBeenCalledTimes(1);
    const savedRelation = deleteCharacterRelationRepository.deleteCharacterRelation.mock.calls[0]?.[0];
    expect(savedRelation?.toSnapshot()).toEqual({
      id: CHARACTER_RELATION_ID,
      workId: WORK_ID,
      characterId: CHARACTER_ID,
      targetCharacterId: TARGET_CHARACTER_ID,
      relationName: "兄",
      deleteFlg: true,
    });
  });

  it("指定したユーザー・IDで登場人物関係を取得すること", async () => {
    const { usecase, deleteCharacterRelationRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    const [userId, characterRelationId] = deleteCharacterRelationRepository.findCharacterRelation.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(characterRelationId?.value).toBe(CHARACTER_RELATION_ID);
  });

  it("削除対象の登場人物関係がない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, deleteCharacterRelationRepository } = createUsecase({ relationExists: false });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(deleteCharacterRelationRepository.deleteCharacterRelation).not.toHaveBeenCalled();
  });

  it("登場人物関係IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, deleteCharacterRelationRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterRelationId: "" })).rejects.toThrow("登場人物関係IDが設定されていません。");
    expect(deleteCharacterRelationRepository.findCharacterRelation).not.toHaveBeenCalled();
    expect(deleteCharacterRelationRepository.deleteCharacterRelation).not.toHaveBeenCalled();
  });
});
