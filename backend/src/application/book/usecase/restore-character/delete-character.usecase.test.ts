import { describe, it, expect, vi } from "vitest";
import { DeleteCharacterUsecase } from "..";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, UserId, WorkId, type IDeleteCharacterRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

function createCharacter() {
  return CharacterEntity.reconstruct({
    id: CharacterId.of(CHARACTER_ID),
    workId: WorkId.of(WORK_ID),
    name: CharacterName.of("石神哲哉"),
    age: CharacterAge.of("40代"),
    genderId: GenderId.of(1),
    occupation: CharacterOccupation.of("数学教師"),
    characteristic: CharacterCharacteristic.of("天才数学者"),
    memo: CharacterMemo.of("メモ"),
    deleteFlg: false,
  });
}

type Options = {
  characterExists?: boolean;
  relations?: { id: string }[];
};

function createUsecase({ characterExists = true, relations = [] }: Options = {}) {
  const deleteCharacterRepository = {
    findCharacter: vi.fn<IDeleteCharacterRepository["findCharacter"]>().mockResolvedValue(characterExists ? createCharacter() : null),
    findCharacterRelationList: vi.fn<IDeleteCharacterRepository["findCharacterRelationList"]>().mockResolvedValue(relations),
    deleteCharacter: vi.fn<IDeleteCharacterRepository["deleteCharacter"]>().mockResolvedValue(),
  } satisfies IDeleteCharacterRepository;

  const usecase = new DeleteCharacterUsecase(deleteCharacterRepository);

  return { usecase, deleteCharacterRepository };
}

describe("DeleteCharacterUsecase", () => {
  it("登場人物を削除済みにして1回保存し、ok を返すこと", async () => {
    const { usecase, deleteCharacterRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result.isOk()).toBe(true);
    expect(deleteCharacterRepository.deleteCharacter).toHaveBeenCalledTimes(1);
    const savedCharacter = deleteCharacterRepository.deleteCharacter.mock.calls[0]?.[0];
    expect(savedCharacter?.toSnapshot()).toEqual({
      id: CHARACTER_ID,
      workId: WORK_ID,
      name: "石神哲哉",
      age: "40代",
      genderId: 1,
      occupation: "数学教師",
      characteristic: "天才数学者",
      memo: "メモ",
      deleteFlg: true,
    });
  });

  it("指定したユーザー・IDで登場人物と人物関係を問い合わせること", async () => {
    const { usecase, deleteCharacterRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    const [characterUserId, characterId] = deleteCharacterRepository.findCharacter.mock.calls[0] ?? [];
    expect(characterUserId).toBe(USER_ID);
    expect(characterId?.value).toBe(CHARACTER_ID);
    const [relationUserId, relationCharacterId] = deleteCharacterRepository.findCharacterRelationList.mock.calls[0] ?? [];
    expect(relationUserId).toBe(USER_ID);
    expect(relationCharacterId?.value).toBe(CHARACTER_ID);
  });

  it("削除対象の登場人物がない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, deleteCharacterRepository } = createUsecase({ characterExists: false });

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(deleteCharacterRepository.deleteCharacter).not.toHaveBeenCalled();
  });

  it("削除されていない人物関係が残っている場合、EXISTS_RELATIONS を返し、保存しないこと", async () => {
    const { usecase, deleteCharacterRepository } = createUsecase({ relations: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVR0" }] });

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "EXISTS_RELATIONS" });
    expect(deleteCharacterRepository.deleteCharacter).not.toHaveBeenCalled();
  });

  it("登場人物IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, deleteCharacterRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterId: "" })).rejects.toThrow("登場人物IDが設定されていません。");
    expect(deleteCharacterRepository.findCharacter).not.toHaveBeenCalled();
    expect(deleteCharacterRepository.findCharacterRelationList).not.toHaveBeenCalled();
    expect(deleteCharacterRepository.deleteCharacter).not.toHaveBeenCalled();
  });
});
