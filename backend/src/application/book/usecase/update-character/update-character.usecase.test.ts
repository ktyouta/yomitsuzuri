import { describe, it, expect, vi } from "vitest";
import { UpdateCharacterUsecase } from "..";
import { CharacterAge, CharacterCharacteristic, CharacterEntity, CharacterId, CharacterMemo, CharacterName, CharacterNameUniquenessDomainService, CharacterOccupation, GenderId, GenderValidityDomainService, WorkId, type ICharacterNameUniquenessRepository, type IGenderValidityRepository, type IUpdateCharacterRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

const BODY = {
  name: "湯川学",
  age: "30代",
  genderId: 1,
  occupation: "物理学者",
  characteristic: "帝都大学准教授",
  memo: "更新後のメモ",
};

type Options = {
  characterExists?: boolean;
  genderExists?: boolean;
  duplicatedIds?: { id: string }[];
};

/**
 * 更新前の登場人物を作成する
 * @returns 永続化済みの登場人物
 */
function createStoredCharacter() {
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

function createUsecase({ characterExists = true, genderExists = true, duplicatedIds = [] }: Options = {}) {
  const updateCharacterRepository = {
    findCharacter: vi.fn<IUpdateCharacterRepository["findCharacter"]>().mockResolvedValue(characterExists ? createStoredCharacter() : null),
    updateCharacter: vi.fn<IUpdateCharacterRepository["updateCharacter"]>().mockResolvedValue(),
  } satisfies IUpdateCharacterRepository;
  const uniquenessRepository = {
    findCharacter: vi.fn<ICharacterNameUniquenessRepository["findCharacter"]>().mockResolvedValue(duplicatedIds),
  } satisfies ICharacterNameUniquenessRepository;
  const genderValidityRepository = {
    exists: vi.fn<IGenderValidityRepository["exists"]>().mockResolvedValue(genderExists),
  } satisfies IGenderValidityRepository;

  const usecase = new UpdateCharacterUsecase(
    updateCharacterRepository,
    new CharacterNameUniquenessDomainService(uniquenessRepository),
    new GenderValidityDomainService(genderValidityRepository),
  );

  return { usecase, updateCharacterRepository, uniquenessRepository, genderValidityRepository };
}

describe("UpdateCharacterUsecase", () => {
  it("登場人物を更新内容で保存し、その内容を返すこと（ID・作品・削除フラグは変えない）", async () => {
    const { usecase, updateCharacterRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID, body: BODY });

    expect(updateCharacterRepository.updateCharacter).toHaveBeenCalledTimes(1);
    const savedCharacter = updateCharacterRepository.updateCharacter.mock.calls[0]?.[0];
    expect(savedCharacter?.toSnapshot()).toEqual({
      id: CHARACTER_ID,
      workId: WORK_ID,
      name: "湯川学",
      age: "30代",
      genderId: 1,
      occupation: "物理学者",
      characteristic: "帝都大学准教授",
      memo: "更新後のメモ",
      deleteFlg: false,
    });

    const dto = result._unsafeUnwrap();
    expect(dto.value).toEqual({
      id: CHARACTER_ID,
      workId: WORK_ID,
      name: "湯川学",
      age: "30代",
      genderId: 1,
      occupation: "物理学者",
      characteristic: "帝都大学准教授",
      memo: "更新後のメモ",
    });
  });

  it("名前以外が未指定の場合、null で保存され、性別を問い合わせないこと", async () => {
    const { usecase, updateCharacterRepository, genderValidityRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID, body: { name: "石神哲哉" } });

    const snapshot = updateCharacterRepository.updateCharacter.mock.calls[0]?.[0].toSnapshot();
    expect(snapshot?.age).toBeNull();
    expect(snapshot?.genderId).toBeNull();
    expect(snapshot?.occupation).toBeNull();
    expect(snapshot?.characteristic).toBeNull();
    expect(snapshot?.memo).toBeNull();
    expect(genderValidityRepository.exists).not.toHaveBeenCalled();
  });

  it("指定したユーザー・登場人物IDで登場人物を問い合わせ、自身を除外して作品内の同名の登場人物を問い合わせること", async () => {
    const { usecase, updateCharacterRepository, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID, body: { ...BODY, name: "  石神哲哉  " } });

    const [characterUserId, characterId] = updateCharacterRepository.findCharacter.mock.calls[0] ?? [];
    expect(characterUserId).toBe(USER_ID);
    expect(characterId?.value).toBe(CHARACTER_ID);
    const [userId, workId, excludedCharacterId, characterName] = uniquenessRepository.findCharacter.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(workId?.value).toBe(WORK_ID);
    expect(excludedCharacterId?.value).toBe(CHARACTER_ID);
    expect(characterName?.value).toBe("石神哲哉");
  });

  it("登場人物が取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, updateCharacterRepository } = createUsecase({ characterExists: false });

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(updateCharacterRepository.updateCharacter).not.toHaveBeenCalled();
  });

  it("性別が無効な場合、INVALID_GENDER を返し、保存しないこと", async () => {
    const { usecase, updateCharacterRepository } = createUsecase({ genderExists: false });

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_GENDER" });
    expect(updateCharacterRepository.updateCharacter).not.toHaveBeenCalled();
  });

  it("作品内に自身以外の同名の登場人物が存在する場合、DUPLICATE_NAME を返し、保存しないこと", async () => {
    const { usecase, updateCharacterRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVT1" }] });

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
    expect(updateCharacterRepository.updateCharacter).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, updateCharacterRepository, uniquenessRepository, genderValidityRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      characterId: CHARACTER_ID,
      body: {
        name: "   ",
        age: "あ".repeat(21),
        genderId: 0,
        occupation: "あ".repeat(51),
        characteristic: "あ".repeat(501),
        memo: "あ".repeat(2001),
      },
    });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "CHARACTER_NAME_EMPTY" } },
        { field: "age", error: { type: "CHARACTER_AGE_TOO_LONG", max: 20 } },
        { field: "genderId", error: { type: "GENDER_ID_INVALID" } },
        { field: "occupation", error: { type: "CHARACTER_OCCUPATION_TOO_LONG", max: 50 } },
        { field: "characteristic", error: { type: "CHARACTER_CHARACTERISTIC_TOO_LONG", max: 500 } },
        { field: "memo", error: { type: "CHARACTER_MEMO_TOO_LONG", max: 2000 } },
      ],
    });
    expect(updateCharacterRepository.findCharacter).not.toHaveBeenCalled();
    expect(genderValidityRepository.exists).not.toHaveBeenCalled();
    expect(uniquenessRepository.findCharacter).not.toHaveBeenCalled();
    expect(updateCharacterRepository.updateCharacter).not.toHaveBeenCalled();
  });

  it("違反している項目だけを INVALID_INPUT で返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID, body: { ...BODY, name: "   " } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "name", error: { type: "CHARACTER_NAME_EMPTY" } }],
    });
  });

  it("登場人物IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, updateCharacterRepository, uniquenessRepository, genderValidityRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, characterId: "", body: BODY })).rejects.toThrow("登場人物IDが設定されていません。");
    expect(updateCharacterRepository.findCharacter).not.toHaveBeenCalled();
    expect(genderValidityRepository.exists).not.toHaveBeenCalled();
    expect(uniquenessRepository.findCharacter).not.toHaveBeenCalled();
    expect(updateCharacterRepository.updateCharacter).not.toHaveBeenCalled();
  });
});
