import { describe, it, expect, vi } from "vitest";
import { DeleteUserUsecase } from "..";
import { UserId } from "../../../../domain/shared";
import { LoginCredentialId, LoginId, UserAggregate, UserBirthday, UserName, UserPassword, UserSalt, type IDeleteUserRepository } from "../../../../domain/user";

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

function createRepository(user: UserAggregate | null, deleted = true) {
  return {
    findUser: vi.fn<IDeleteUserRepository["findUser"]>().mockResolvedValue(user),
    deleteUser: vi.fn<IDeleteUserRepository["deleteUser"]>().mockResolvedValue(deleted),
  } satisfies IDeleteUserRepository;
}

describe("DeleteUserUsecase", () => {
  it("削除できた場合、trueを返すこと", async () => {
    const repository = createRepository(createUser());
    const usecase = new DeleteUserUsecase(repository);

    expect(await usecase.execute({ userId: UserId.of(USER_ID) })).toBe(true);
    expect(repository.deleteUser.mock.calls[0]?.[0].toSnapshot().deleteFlg).toBe(true);
  });

  it("対象ユーザーが存在しない場合、falseを返し、削除しないこと", async () => {
    const repository = createRepository(null);
    const usecase = new DeleteUserUsecase(repository);

    expect(await usecase.execute({ userId: UserId.of(USER_ID) })).toBe(false);
    expect(repository.deleteUser).not.toHaveBeenCalled();
  });

  it("削除できなかった場合、falseを返すこと", async () => {
    const usecase = new DeleteUserUsecase(createRepository(createUser(), false));

    expect(await usecase.execute({ userId: UserId.of(USER_ID) })).toBe(false);
  });
});
