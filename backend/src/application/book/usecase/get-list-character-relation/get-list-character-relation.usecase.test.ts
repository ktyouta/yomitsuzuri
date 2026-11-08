import { describe, expect, it, vi } from "vitest";
import { GetListCharacterRelationUsecase } from "..";
import { UserId, type CharacterRelationListItem, type IGetListCharacterRelationRepository } from "../../../../domain";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

const RELATIONS: CharacterRelationListItem[] = [
  {
    id: "01BX5ZZKBKACTAV9WEVGEMMVT0",
    characterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
    characterName: "山田",
    targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC1",
    targetCharacterName: "佐藤",
    relationName: "兄",
  },
  {
    id: "01BX5ZZKBKACTAV9WEVGEMMVT1",
    characterId: "01BX5ZZKBKACTAV9WEVGEMMVC2",
    characterName: "鈴木",
    targetCharacterId: "01BX5ZZKBKACTAV9WEVGEMMVC0",
    targetCharacterName: "山田",
    relationName: "上司",
  },
];

function createRepository(work: { id: string } | null, relations: CharacterRelationListItem[]) {
  return {
    findWork: vi.fn<IGetListCharacterRelationRepository["findWork"]>().mockResolvedValue(work),
    findCharacterRelationList: vi.fn<IGetListCharacterRelationRepository["findCharacterRelationList"]>().mockResolvedValue(relations),
  } satisfies IGetListCharacterRelationRepository;
}

describe("GetListCharacterRelationUsecase", () => {
  it("取得した登場人物関係一覧をそのまま返すこと", async () => {
    const usecase = new GetListCharacterRelationUsecase(createRepository({ id: WORK_ID }, RELATIONS));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: RELATIONS });
  });

  it("関係が0件の場合、空の一覧を返すこと", async () => {
    const usecase = new GetListCharacterRelationUsecase(createRepository({ id: WORK_ID }, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: [] });
  });

  it("作品が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetListCharacterRelationUsecase(createRepository(null, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・作品IDで作品と登場人物関係一覧を問い合わせること", async () => {
    const repository = createRepository({ id: WORK_ID }, RELATIONS);
    const usecase = new GetListCharacterRelationUsecase(repository);

    await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    const [workUserId, workId] = repository.findWork.mock.calls[0];
    expect(workUserId).toBe(USER_ID);
    expect(workId.value).toBe(WORK_ID);
    const [relationUserId, relationWorkId] = repository.findCharacterRelationList.mock.calls[0];
    expect(relationUserId).toBe(USER_ID);
    expect(relationWorkId.value).toBe(WORK_ID);
  });

  it("作品IDが空の場合、例外になり、作品も関係も問い合わせないこと", async () => {
    const repository = createRepository({ id: WORK_ID }, RELATIONS);
    const usecase = new GetListCharacterRelationUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, workId: "" })).rejects.toThrow("作品IDが設定されていません。");
    expect(repository.findWork).not.toHaveBeenCalled();
    expect(repository.findCharacterRelationList).not.toHaveBeenCalled();
  });
});
