import { describe, it, expect, vi } from "vitest";
import { GetListCharacterUsecase } from "..";
import type { CharacterListItem, IGetListCharacterRepository } from "../../../../domain/book";
import { UserId } from "../../../../domain/shared";

const USER_ID = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
const WORK_ID = "01BX5ZZKBKACTAV9WEVGEMMVS0";

const CHARACTERS: CharacterListItem[] = [
  { id: "01BX5ZZKBKACTAV9WEVGEMMVT0", name: "石神哲哉", age: "40代", occupation: "数学教師", updatedAt: "2026-10-01T00:00:00.000Z" },
];

function createRepository(work: { id: string } | null, characters: CharacterListItem[]) {
  return {
    findWork: vi.fn<IGetListCharacterRepository["findWork"]>().mockResolvedValue(work),
    findCharacterList: vi.fn<IGetListCharacterRepository["findCharacterList"]>().mockResolvedValue(characters),
  } satisfies IGetListCharacterRepository;
}

describe("GetListCharacterUsecase", () => {
  it("取得した登場人物一覧をそのまま返すこと", async () => {
    const usecase = new GetListCharacterUsecase(createRepository({ id: WORK_ID }, CHARACTERS));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: CHARACTERS });
  });

  it("登場人物が0件の場合、空の一覧を返すこと", async () => {
    const usecase = new GetListCharacterUsecase(createRepository({ id: WORK_ID }, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrap().value).toEqual({ list: [] });
  });

  it("作品が取得できない場合、NOT_FOUND を返すこと", async () => {
    const usecase = new GetListCharacterUsecase(createRepository(null, []));

    const result = await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("指定したユーザー・作品IDで作品と登場人物一覧を問い合わせること", async () => {
    const repository = createRepository({ id: WORK_ID }, CHARACTERS);
    const usecase = new GetListCharacterUsecase(repository);

    await usecase.execute({ userId: USER_ID, workId: WORK_ID });

    const [workUserId, workId] = repository.findWork.mock.calls[0];
    expect(workUserId).toBe(USER_ID);
    expect(workId.value).toBe(WORK_ID);
    const [characterUserId, characterWorkId] = repository.findCharacterList.mock.calls[0];
    expect(characterUserId).toBe(USER_ID);
    expect(characterWorkId.value).toBe(WORK_ID);
  });

  it("作品IDが空の場合、例外になり、作品も登場人物も問い合わせないこと", async () => {
    const repository = createRepository({ id: WORK_ID }, CHARACTERS);
    const usecase = new GetListCharacterUsecase(repository);

    await expect(usecase.execute({ userId: USER_ID, workId: "" })).rejects.toThrow("作品IDが設定されていません。");
    expect(repository.findWork).not.toHaveBeenCalled();
    expect(repository.findCharacterList).not.toHaveBeenCalled();
  });
});
