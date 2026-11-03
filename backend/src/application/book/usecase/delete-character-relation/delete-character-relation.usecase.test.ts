import { describe, expect, it, vi } from "vitest";
import { DeleteCharacterRelationUsecase } from "..";
import type { IDeleteCharacterRelationRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_RELATION_ID = "01BX5ZZKBKACTAV9WEVGEMMVR0";

type Options = {
  deleted?: boolean;
};

function createUsecase({ deleted = true }: Options = {}) {
  const deleteCharacterRelationRepository = {
    deleteCharacterRelation: vi.fn<IDeleteCharacterRelationRepository["deleteCharacterRelation"]>().mockResolvedValue(deleted),
  } satisfies IDeleteCharacterRelationRepository;

  const usecase = new DeleteCharacterRelationUsecase(deleteCharacterRelationRepository);

  return { usecase, deleteCharacterRelationRepository };
}

describe("DeleteCharacterRelationUsecase", () => {
  it("登場人物関係を削除できた場合、ok を返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result.isOk()).toBe(true);
  });

  it("指定したユーザー・IDで登場人物関係を1回削除すること", async () => {
    const { usecase, deleteCharacterRelationRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(deleteCharacterRelationRepository.deleteCharacterRelation).toHaveBeenCalledTimes(1);
    const [userId, characterRelationId] = deleteCharacterRelationRepository.deleteCharacterRelation.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(characterRelationId?.value).toBe(CHARACTER_RELATION_ID);
  });

  it("削除対象の登場人物関係がない場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, characterRelationId: CHARACTER_RELATION_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("登場人物関係IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, deleteCharacterRelationRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterRelationId: "" })).rejects.toThrow("登場人物関係IDが設定されていません。");
    expect(deleteCharacterRelationRepository.deleteCharacterRelation).not.toHaveBeenCalled();
  });
});
