import { describe, it, expect, vi } from "vitest";
import { UpdateUserDarkModeUsecase } from "..";
import { UserId } from "../../../../domain/shared";
import type { IUpdateUserDarkModeRepository } from "../../../../domain/user";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

function createRepository(updated: boolean) {
  return {
    updateDarkMode: vi.fn<IUpdateUserDarkModeRepository["updateDarkMode"]>().mockResolvedValue(updated),
  } satisfies IUpdateUserDarkModeRepository;
}

describe("UpdateUserDarkModeUsecase", () => {
  it("更新できた場合、指定したダークモードの値を持つ結果を返すこと", async () => {
    const usecase = new UpdateUserDarkModeUsecase(createRepository(true));

    const result = await usecase.execute(UserId.of(USER_ID), true);

    expect(result?.value.darkMode).toBe(true);
  });

  it("更新できなかった場合、nullを返すこと", async () => {
    const usecase = new UpdateUserDarkModeUsecase(createRepository(false));

    const result = await usecase.execute(UserId.of(USER_ID), true);

    expect(result).toBeNull();
  });
});
