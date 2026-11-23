import { describe, expect, it, vi } from "vitest";
import { CharacterRelationId, UserId, type IHardDeleteCharacterRelationRepository } from "../../../../domain";
import { HardDeleteCharacterRelationUsecase } from "./hard-delete-character-relation.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_RELATION_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAZ";

type Options = {
  deleted?: boolean;
};

function createUsecase({ deleted = true }: Options = {}) {
  const hardDeleteCharacterRelationRepository = {
    deleteCharacterRelation: vi.fn<IHardDeleteCharacterRelationRepository["deleteCharacterRelation"]>().mockResolvedValue(deleted),
  } satisfies IHardDeleteCharacterRelationRepository;

  const usecase = new HardDeleteCharacterRelationUsecase(hardDeleteCharacterRelationRepository);

  return { usecase, hardDeleteCharacterRelationRepository };
}

describe("HardDeleteCharacterRelationUsecase", () => {
  it("指定したユーザー・登場人物関係IDで1回物理削除し、ok を返すこと", async () => {
    const { usecase, hardDeleteCharacterRelationRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result.isOk()).toBe(true);
    expect(hardDeleteCharacterRelationRepository.deleteCharacterRelation).toHaveBeenCalledTimes(1);
    expect(hardDeleteCharacterRelationRepository.deleteCharacterRelation).toHaveBeenCalledWith(USER_ID, CharacterRelationId.of(CHARACTER_RELATION_ID));
  });

  it("削除済みの登場人物関係がなく削除されなかった場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("登場人物関係IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, hardDeleteCharacterRelationRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterRelationId: "" })).rejects.toThrow("登場人物関係IDが設定されていません。");
    expect(hardDeleteCharacterRelationRepository.deleteCharacterRelation).not.toHaveBeenCalled();
  });
});
