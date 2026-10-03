import { describe, it, expect, vi } from "vitest";
import { UpdateUserDarkModeUsecase } from "../../../../src/application/user/usecase";
import type { IUpdateUserDarkModeRepository } from "../../../../src/domain/user";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

function createRepository(updated: boolean) {
  return {
    updateDarkMode: vi.fn<IUpdateUserDarkModeRepository["updateDarkMode"]>().mockResolvedValue(updated),
  } satisfies IUpdateUserDarkModeRepository;
}

describe("UpdateUserDarkModeUsecase", () => {
  it("更新できた場合、指定したダークモードの値を持つ結果を返すこと", async () => {
    const usecase = new UpdateUserDarkModeUsecase(createRepository(true));

    const result = await usecase.execute(USER_ID, true);

    expect(result?.value.darkMode).toBe(true);
  });

  it("更新できなかった場合、nullを返すこと", async () => {
    const usecase = new UpdateUserDarkModeUsecase(createRepository(false));

    const result = await usecase.execute(USER_ID, true);

    expect(result).toBeNull();
  });

  it("ユーザーIDが空の場合、例外になり、更新しないこと", async () => {
    const repository = createRepository(true);
    const usecase = new UpdateUserDarkModeUsecase(repository);

    await expect(usecase.execute("", true)).rejects.toThrow();
    expect(repository.updateDarkMode).not.toHaveBeenCalled();
  });
});
