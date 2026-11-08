import { describe, it, expect, vi } from "vitest";
import { GetCharacterUsecase } from "..";
import { UserId, type CharacterDetail, type CharacterDetailRelationItem, type IGetCharacterRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const CHARACTER_ID = "01BX5ZZKBKACTAV9WEVGEMMVT0";

const CHARACTER: CharacterDetail = {
  id: CHARACTER_ID,
  workId: "01BX5ZZKBKACTAV9WEVGEMMVS0",
  name: "山田太郎",
  age: "30代",
  genderId: 1,
  genderLabel: "男性",
  occupation: "探偵",
  characteristic: "左利き",
  memo: "依頼人と以前から知り合い？",
  updatedAt: "2026-10-01T00:00:00.000Z",
  deleteFlg: false,
};

const RELATIONS: CharacterDetailRelationItem[] = [
  {
    id: "01BX5ZZKBKACTAV9WEVGEMMVR0",
    characterId: CHARACTER_ID,
    characterName: "山田太郎",
    targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVT1",
    targetCharacterName: "佐藤花子",
    relationName: "依頼人",
  },
];

function createRepository(character: CharacterDetail | null, relations: CharacterDetailRelationItem[]) {
  return {
    findCharacter: vi.fn<IGetCharacterRepository["findCharacter"]>().mockResolvedValue(character),
    findCharacterRelationList: vi.fn<IGetCharacterRepository["findCharacterRelationList"]>().mockResolvedValue(relations),
  } satisfies IGetCharacterRepository;
}

describe("GetCharacterUsecase", () => {
  it("取得した登場人物と関係一覧を返すこと", async () => {
    const usecase = new GetCharacterUsecase(createRepository(CHARACTER, RELATIONS));

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrap().value).toEqual({ ...CHARACTER, relations: RELATIONS });
  });

  it("関係が0件の場合、空の関係一覧を返すこと", async () => {
    const usecase = new GetCharacterUsecase(createRepository(CHARACTER, []));

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrap().value.relations).toEqual([]);
  });

  it("論理削除済みの登場人物も、削除フラグを付けて返すこと", async () => {
    const usecase = new GetCharacterUsecase(createRepository({ ...CHARACTER, deleteFlg: true }, []));

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrap().value.deleteFlg).toBe(true);
  });

  it("登場人物が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetCharacterUsecase(createRepository(null, []));

    const result = await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・登場人物IDで登場人物と関係一覧を問い合わせること", async () => {
    const repository = createRepository(CHARACTER, RELATIONS);
    const usecase = new GetCharacterUsecase(repository);

    await usecase.execute({ userId: USER_ID, characterId: CHARACTER_ID });

    const [characterUserId, characterId] = repository.findCharacter.mock.calls[0];
    expect(characterUserId).toBe(USER_ID);
    expect(characterId.value).toBe(CHARACTER_ID);
    const [relationUserId, relationCharacterId] = repository.findCharacterRelationList.mock.calls[0];
    expect(relationUserId).toBe(USER_ID);
    expect(relationCharacterId.value).toBe(CHARACTER_ID);
  });

  it("登場人物IDが空の場合、例外になり、登場人物も関係も問い合わせないこと", async () => {
    const repository = createRepository(CHARACTER, RELATIONS);
    const usecase = new GetCharacterUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, characterId: "" })).rejects.toThrow("登場人物IDが設定されていません。");
    expect(repository.findCharacter).not.toHaveBeenCalled();
    expect(repository.findCharacterRelationList).not.toHaveBeenCalled();
  });
});
