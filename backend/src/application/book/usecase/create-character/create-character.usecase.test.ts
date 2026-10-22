import { describe, it, expect, vi } from "vitest";
import { CreateCharacterUsecase } from "..";
import { CharacterNameUniquenessDomainService, GenderValidityDomainService, type ICharacterNameUniquenessRepository, type ICreateCharacterRepository, type IGenderValidityRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";
const ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;

const BODY = {
  name: "石神哲哉",
  age: "40代",
  genderId: 1,
  occupation: "数学教師",
  characteristic: "天才数学者",
  memo: "メモ",
};

type Options = {
  workExists?: boolean;
  genderExists?: boolean;
  duplicatedIds?: { id: string }[];
};

function createUsecase({ workExists = true, genderExists = true, duplicatedIds = [] }: Options = {}) {
  const createCharacterRepository = {
    findWork: vi.fn<ICreateCharacterRepository["findWork"]>().mockResolvedValue(workExists ? { id: WORK_ID } : null),
    createCharacter: vi.fn<ICreateCharacterRepository["createCharacter"]>().mockResolvedValue(),
  } satisfies ICreateCharacterRepository;
  const uniquenessRepository = {
    findCharacter: vi.fn<ICharacterNameUniquenessRepository["findCharacter"]>().mockResolvedValue(duplicatedIds),
  } satisfies ICharacterNameUniquenessRepository;
  const genderValidityRepository = {
    exists: vi.fn<IGenderValidityRepository["exists"]>().mockResolvedValue(genderExists),
  } satisfies IGenderValidityRepository;

  const usecase = new CreateCharacterUsecase(
    createCharacterRepository,
    new CharacterNameUniquenessDomainService(uniquenessRepository),
    new GenderValidityDomainService(genderValidityRepository),
  );

  return { usecase, createCharacterRepository, uniquenessRepository, genderValidityRepository };
}

describe("CreateCharacterUsecase", () => {
  it("指定した作品に登場人物を保存し、その内容を返すこと", async () => {
    const { usecase, createCharacterRepository } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(createCharacterRepository.createCharacter).toHaveBeenCalledTimes(1);
    const savedCharacter = createCharacterRepository.createCharacter.mock.calls[0]?.[0];
    expect(savedCharacter?.toSnapshot()).toEqual({
      id: expect.stringMatching(ULID_PATTERN),
      workId: WORK_ID,
      name: "石神哲哉",
      age: "40代",
      genderId: 1,
      occupation: "数学教師",
      characteristic: "天才数学者",
      memo: "メモ",
      deleteFlg: false,
    });

    const dto = result._unsafeUnwrap();
    expect(dto.value.id).toBe(savedCharacter?.id.value);
    expect(dto.value.name).toBe("石神哲哉");
  });

  it("名前以外が未指定の場合、null で保存され、性別を問い合わせないこと", async () => {
    const { usecase, createCharacterRepository, genderValidityRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { name: "石神哲哉" } });

    const snapshot = createCharacterRepository.createCharacter.mock.calls[0]?.[0].toSnapshot();
    expect(snapshot?.age).toBeNull();
    expect(snapshot?.genderId).toBeNull();
    expect(snapshot?.occupation).toBeNull();
    expect(snapshot?.characteristic).toBeNull();
    expect(snapshot?.memo).toBeNull();
    expect(genderValidityRepository.exists).not.toHaveBeenCalled();
  });

  it("作品が取得できない場合、NOT_FOUND を返し、保存しないこと", async () => {
    const { usecase, createCharacterRepository } = createUsecase({ workExists: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(createCharacterRepository.createCharacter).not.toHaveBeenCalled();
  });

  it("性別が無効な場合、INVALID_GENDER を返し、保存しないこと", async () => {
    const { usecase, createCharacterRepository } = createUsecase({ genderExists: false });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "INVALID_GENDER" });
    expect(createCharacterRepository.createCharacter).not.toHaveBeenCalled();
  });

  it("作品内に同名の登場人物が存在する場合、DUPLICATE_NAME を返し、保存しないこと", async () => {
    const { usecase, createCharacterRepository } = createUsecase({ duplicatedIds: [{ id: "01BX5ZZKBKACTAV9WEVGEMMVT0" }] });

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
    expect(createCharacterRepository.createCharacter).not.toHaveBeenCalled();
  });

  it("指定したユーザー・作品IDで作品を問い合わせ、ユーザー・作品ID・名前で同名の登場人物を問い合わせること", async () => {
    const { usecase, createCharacterRepository, uniquenessRepository } = createUsecase();

    await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { ...BODY, name: "  石神哲哉  " } });

    const [workUserId, workId] = createCharacterRepository.findWork.mock.calls[0] ?? [];
    expect(workUserId).toBe(USER_ID);
    expect(workId?.value).toBe(WORK_ID);
    const [userId, uniquenessWorkId, , characterName] = uniquenessRepository.findCharacter.mock.calls[0] ?? [];
    expect(userId).toBe(USER_ID);
    expect(uniquenessWorkId?.value).toBe(WORK_ID);
    expect(characterName?.value).toBe("石神哲哉");
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず保存しないこと", async () => {
    const { usecase, createCharacterRepository, uniquenessRepository, genderValidityRepository } = createUsecase();

    const result = await usecase.execute({
      userId: USER_ID,
      workId: WORK_ID,
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
    expect(createCharacterRepository.findWork).not.toHaveBeenCalled();
    expect(genderValidityRepository.exists).not.toHaveBeenCalled();
    expect(uniquenessRepository.findCharacter).not.toHaveBeenCalled();
    expect(createCharacterRepository.createCharacter).not.toHaveBeenCalled();
  });

  it("違反している項目だけを INVALID_INPUT で返すこと", async () => {
    const { usecase } = createUsecase();

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID, body: { ...BODY, name: "   " } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [{ field: "name", error: { type: "CHARACTER_NAME_EMPTY" } }],
    });
  });

  it("作品IDが空の場合、例外になり、DB を問い合わせないこと", async () => {
    const { usecase, createCharacterRepository, uniquenessRepository, genderValidityRepository } = createUsecase();

    await expect(usecase.execute({ userId: USER_ID, workId: "", body: BODY })).rejects.toThrow("作品IDが設定されていません。");
    expect(createCharacterRepository.findWork).not.toHaveBeenCalled();
    expect(genderValidityRepository.exists).not.toHaveBeenCalled();
    expect(uniquenessRepository.findCharacter).not.toHaveBeenCalled();
    expect(createCharacterRepository.createCharacter).not.toHaveBeenCalled();
  });
});
