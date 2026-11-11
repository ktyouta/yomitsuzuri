import { describe, it, expect, vi } from "vitest";
import { RestoreCharacterUsecase } from "..";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterId, CharacterMemo, CharacterName, CharacterOccupation, GenderId, UserId, WorkId, type IRestoreCharacterRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

/**
 * 削除済みの登場人物
 */
function createDeletedCharacter() {
  return CharacterEntity.reconstruct({
    id: CharacterId.of(CHARACTER_ID),
    workId: WorkId.of(WORK_ID),
    name: CharacterName.of("石神哲哉"),
    age: CharacterAge.of("40代"),
    genderId: GenderId.of(1),
    occupation: CharacterOccupation.of("数学教師"),
    characteristic: CharacterCharacteristic.of("天才数学者"),
    memo: CharacterMemo.of("メモ"),
    deleteFlg: true,
  });
}

type Options = {
  characterExists?: boolean;
};

function createUsecase({ characterExists = true }: Options = {}) {
  const restoreCharacterRepository = {
    findCharacter: vi.fn<IRestoreCharacterRepository["findCharacter"]>().mockResolvedValue(characterExists ? createDeletedCharacter() : null),
    restoreCharacter: vi.fn<IRestoreCharacterRepository["restoreCharacter"]>().mockResolvedValue(),
  } satisfies IRestoreCharacterRepository;

  const usecase = new RestoreCharacterUsecase(restoreCharacterRepository);

  return { usecase, restoreCharacterRepository };
}

const EXPECTED_VALUE = {
  id: CHARACTER_ID,
  workId: WORK_ID,
  name: "石神哲哉",
  age: "40代",
  genderId: 1,
  occupation: "数学教師",
  characteristic: "天才数学者",
  memo: "メモ",
};

describe("RestoreCharacterUsecase", () => {
  it("登場人物の削除済みを解除して1回保存し、復元した登場人物を返すこと", async () => {
    const { usecase, restoreCharacterRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrap().value).toEqual(EXPECTED_VALUE);
    expect(restoreCharacterRepository.restoreCharacter).toHaveBeenCalledTimes(1);
    const savedCharacter = restoreCharacterRepository.restoreCharacter.mock.calls[0]?.[0];
    expect(savedCharacter?.toSnapshot()).toEqual({ ...EXPECTED_VALUE, deleteFlg: false });
  });

  it("指定したユーザー・IDで登場人物を問い合わせること", async () => {
    const { usecase, restoreCharacterRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    const [userId, characterId] = restoreCharacterRepository.findCharacter.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(characterId?.value).toBe(CHARACTER_ID);
  });

  it("削除済みの登場人物がない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, restoreCharacterRepository } = createUsecase({ characterExists: false });

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(restoreCharacterRepository.restoreCharacter).not.toHaveBeenCalled();
  });

  it("登場人物IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, restoreCharacterRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterId: "" })).rejects.toThrow();
    expect(restoreCharacterRepository.findCharacter).not.toHaveBeenCalled();
    expect(restoreCharacterRepository.restoreCharacter).not.toHaveBeenCalled();
  });
});
