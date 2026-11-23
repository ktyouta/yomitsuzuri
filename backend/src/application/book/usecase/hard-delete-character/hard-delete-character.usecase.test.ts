import { describe, expect, it, vi } from "vitest";
import { CharacterId, UserId, type IHardDeleteCharacterRepository } from "../../../../domain";
import { HardDeleteCharacterUsecase } from "./hard-delete-character.usecase";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FB1";

type Options = {
  deleted?: boolean;
};

function createUsecase({ deleted = true }: Options = {}) {
  const hardDeleteCharacterRepository = {
    deleteCharacter: vi.fn<IHardDeleteCharacterRepository["deleteCharacter"]>().mockResolvedValue(deleted),
  } satisfies IHardDeleteCharacterRepository;

  const usecase = new HardDeleteCharacterUsecase(hardDeleteCharacterRepository);

  return { usecase, hardDeleteCharacterRepository };
}

describe("HardDeleteCharacterUsecase", () => {
  it("指定したユーザー・登場人物IDで1回物理削除し、ok を返すこと", async () => {
    const { usecase, hardDeleteCharacterRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result.isOk()).toBe(true);
    expect(hardDeleteCharacterRepository.deleteCharacter).toHaveBeenCalledTimes(1);
    expect(hardDeleteCharacterRepository.deleteCharacter).toHaveBeenCalledWith(USER_ID, CharacterId.of(CHARACTER_ID));
  });

  it("削除済みの登場人物がなく削除されなかった場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase({ deleted: false });

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("登場人物IDが空の場合、DB を問い合わせずに throw すること", async () => {
    const { usecase, hardDeleteCharacterRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterId: "" })).rejects.toThrow("登場人物IDが設定されていません。");
    expect(hardDeleteCharacterRepository.deleteCharacter).not.toHaveBeenCalled();
  });
});
