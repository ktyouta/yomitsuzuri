import { describe, it, expect, vi } from "vitest";
import { DeleteUserUsecase } from "..";
import type { IDeleteUserRepository } from "../../../../domain/user";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

function createRepository(deleted: boolean) {
  return {
    deleteUserWithLogin: vi.fn<IDeleteUserRepository["deleteUserWithLogin"]>().mockResolvedValue(deleted),
  } satisfies IDeleteUserRepository;
}

describe("DeleteUserUsecase", () => {
  it("削除できた場合、trueを返すこと", async () => {
    const usecase = new DeleteUserUsecase(createRepository(true));

    expect(await usecase.execute(USER_ID)).toBe(true);
  });

  it("削除できなかった場合、falseを返すこと", async () => {
    const usecase = new DeleteUserUsecase(createRepository(false));

    expect(await usecase.execute(USER_ID)).toBe(false);
  });

  it("ユーザーIDが空の場合、例外になり、削除しないこと", async () => {
    const repository = createRepository(true);
    const usecase = new DeleteUserUsecase(repository);

    await expect(usecase.execute("")).rejects.toThrow();
    expect(repository.deleteUserWithLogin).not.toHaveBeenCalled();
  });
});
