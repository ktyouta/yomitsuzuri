import { describe, it, expect, vi } from "vitest";
import { UpdateUserUsecase } from "..";
import { LoginCredentialId, LoginId, UserAggregate, UserBirthday, UserNameUniquenessDomainService, UserPassword, UserSalt } from "../../../../domain/user";
import { UserId, UserName } from "../../../../domain";
import type { IUpdateUserRepository, IUserNameUniquenessRepository } from "../../../../domain/user";
import type { EnvConfig } from "../../../../config";

const testConfig: EnvConfig = {
  accessTokenJwtKey: "test-jwt-secret-key-for-access-token",
  accessTokenExpires: "15m",
  refreshTokenJwtKey: "test-jwt-secret-key-for-refresh-token",
  refreshTokenExpires: "7d",
  pepper: "test-pepper",
  corsOrigin: ["http://localhost:5173"],
  isProduction: false,
  allowUserOperation: true,
};

const USER_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAV";

function createUser(darkMode: boolean) {
  return UserAggregate.reconstruct({
    id: UserId.of(USER_ID),
    name: UserName.of("testuser"),
    birthday: UserBirthday.of("19900101"),
    darkMode,
    loginCredentialId: LoginCredentialId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
    loginId: LoginId.of("testuser"),
    password: UserPassword.of("hashed"),
    salt: UserSalt.of("salt"),
    deleteFlg: false,
  });
}

function createUsecase(duplicated: boolean, user: UserAggregate | null, updated = true) {
  const repository = {
    findUser: vi.fn<IUpdateUserRepository["findUser"]>().mockResolvedValue(user),
    updateUser: vi.fn<IUpdateUserRepository["updateUser"]>().mockResolvedValue(updated),
  } satisfies IUpdateUserRepository;
  const uniquenessRepository = {
    findUser: vi.fn<IUserNameUniquenessRepository["findUser"]>().mockResolvedValue(duplicated ? [{ id: "01HZZZZZZZZZZZZZZZZZZZZZZZ" }] : []),
  } satisfies IUserNameUniquenessRepository;

  const usecase = new UpdateUserUsecase(repository, testConfig, new UserNameUniquenessDomainService(uniquenessRepository));

  return { usecase, repository, uniquenessRepository };
}

describe("UpdateUserUsecase", () => {
  it("名前が重複しておらずユーザーが存在する場合、更新後のユーザー・リフレッシュトークンを返すこと", async () => {
    const { usecase } = createUsecase(false, createUser(true));

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "renamed", birthday: "20000101" });

    const dto = result._unsafeUnwrap();
    expect(dto.value.user.name).toBe("renamed");
    expect(dto.value.user.birthday).toBe("20000101");
    expect(dto.value.user.darkMode).toBe(true);
    expect(dto.value.refreshToken).toBeTruthy();
  });

  it("名前が重複している場合、DUPLICATE_NAME を返し、更新しないこと", async () => {
    const { usecase, repository } = createUsecase(true, createUser(false));

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "renamed", birthday: "20000101" });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "DUPLICATE_NAME" });
    expect(repository.updateUser).not.toHaveBeenCalled();
  });

  it("ユーザーが存在しない場合、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase(false, null);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "renamed", birthday: "20000101" });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("更新対象がない場合（取得後に削除された等）、NOT_FOUND を返すこと", async () => {
    const { usecase } = createUsecase(false, createUser(false), false);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "renamed", birthday: "20000101" });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず更新しないこと", async () => {
    const { usecase, repository, uniquenessRepository } = createUsecase(false, createUser(false));

    const result = await usecase.execute({ userId: UserId.of(USER_ID), name: "", birthday: "20000431" });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "USER_NAME_TOO_SHORT", min: 3 } },
        { field: "birthday", error: { type: "USER_BIRTHDAY_NOT_EXIST" } },
      ],
    });
    expect(uniquenessRepository.findUser).not.toHaveBeenCalled();
    expect(repository.updateUser).not.toHaveBeenCalled();
  });
});
