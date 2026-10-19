import { describe, it, expect, vi } from "vitest";
import { UpdateUserDarkModeUsecase } from "..";
import { UserId } from "../../../../domain/shared";
import { LoginCredentialId, LoginId, UserAggregate, UserBirthday, UserName, UserPassword, UserSalt, type IUpdateUserDarkModeRepository } from "../../../../domain/user";

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

function createUser() {
  return UserAggregate.reconstruct({
    id: UserId.of(USER_ID),
    name: UserName.of("testuser"),
    birthday: UserBirthday.of("19900101"),
    darkMode: false,
    loginCredentialId: LoginCredentialId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
    loginId: LoginId.of("testuser"),
    password: UserPassword.of("hashed"),
    salt: UserSalt.of("salt"),
    deleteFlg: false,
  });
}

function createRepository(user: UserAggregate | null, updated = true) {
  return {
    findUser: vi.fn<IUpdateUserDarkModeRepository["findUser"]>().mockResolvedValue(user),
    updateDarkMode: vi.fn<IUpdateUserDarkModeRepository["updateDarkMode"]>().mockResolvedValue(updated),
  } satisfies IUpdateUserDarkModeRepository;
}

describe("UpdateUserDarkModeUsecase", () => {
  it("更新できた場合、指定したダークモードの値を持つ結果を返すこと", async () => {
    const repository = createRepository(createUser());
    const usecase = new UpdateUserDarkModeUsecase(repository);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), darkMode: true });

    expect(result?.value.darkMode).toBe(true);
    expect(repository.updateDarkMode.mock.calls[0]?.[0].darkMode).toBe(true);
  });

  it("対象ユーザーが存在しない場合、nullを返し、更新しないこと", async () => {
    const repository = createRepository(null);
    const usecase = new UpdateUserDarkModeUsecase(repository);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), darkMode: true });

    expect(result).toBeNull();
    expect(repository.updateDarkMode).not.toHaveBeenCalled();
  });

  it("更新できなかった場合、nullを返すこと", async () => {
    const usecase = new UpdateUserDarkModeUsecase(createRepository(createUser(), false));

    const result = await usecase.execute({ userId: UserId.of(USER_ID), darkMode: true });

    expect(result).toBeNull();
  });
});
