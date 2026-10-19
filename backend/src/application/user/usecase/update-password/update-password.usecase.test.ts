import { describe, it, expect, vi } from "vitest";
import { UpdatePasswordUsecase } from "..";
import { LoginCredentialId, LoginId, Pepper, UserAggregate, UserBirthday, UserPassword, UserSalt } from "../../../../domain/user";
import type { IUpdatePasswordRepository } from "../../../../domain/user";
import { UserId, UserName } from "../../../../domain";
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
const LOGIN_CREDENTIAL_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const NOW_PASSWORD = "now-password";
const NEW_PASSWORD = "new-password";
const BODY = { nowPassword: NOW_PASSWORD, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

async function createUser() {
  const salt = UserSalt.generate();
  const passwordHash = await UserPassword.hash(NOW_PASSWORD, salt, new Pepper(testConfig.pepper));
  return UserAggregate.reconstruct({
    id: UserId.of(USER_ID),
    name: UserName.of("testuser"),
    birthday: UserBirthday.of("19900101"),
    darkMode: false,
    loginCredentialId: LoginCredentialId.of(LOGIN_CREDENTIAL_ID),
    loginId: LoginId.of("testuser"),
    password: passwordHash,
    salt,
    deleteFlg: false,
  });
}

function createRepository(user: UserAggregate | null, updated: boolean) {
  return {
    findUser: vi.fn<IUpdatePasswordRepository["findUser"]>().mockResolvedValue(user),
    updatePassword: vi.fn<IUpdatePasswordRepository["updatePassword"]>().mockResolvedValue(updated),
  } satisfies IUpdatePasswordRepository;
}

describe("UpdatePasswordUsecase", () => {
  it("今のパスワードが正しい場合、新しいパスワードのハッシュで更新し、ok を返すこと", async () => {
    const user = await createUser();
    const salt = user.toSnapshot().salt;
    const repository = createRepository(user, true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), body: BODY });

    expect(result.isOk()).toBe(true);
    expect(repository.updatePassword).toHaveBeenCalledTimes(1);
    const savedHash = repository.updatePassword.mock.calls[0]?.[0].toSnapshot().passwordHash;
    const expectedHash = await UserPassword.hash(NEW_PASSWORD, UserSalt.of(salt), new Pepper(testConfig.pepper));
    expect(savedHash).toBe(expectedHash.value);
  });

  it("更新対象がなかった場合、NOT_FOUND を返すこと", async () => {
    const repository = createRepository(await createUser(), false);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("ユーザーが存在しない場合、NOT_FOUND を返し、パスワードを更新しないこと", async () => {
    const repository = createRepository(null, true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), body: BODY });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(repository.updatePassword).not.toHaveBeenCalled();
  });

  it("今のパスワードが違う場合、CURRENT_PASSWORD_MISMATCH を返し、パスワードを更新しないこと", async () => {
    const repository = createRepository(await createUser(), true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), body: { ...BODY, nowPassword: "wrong-password" } });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CURRENT_PASSWORD_MISMATCH" });
    expect(repository.updatePassword).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず更新しないこと", async () => {
    const repository = createRepository(await createUser(), true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute({ userId: UserId.of(USER_ID), body: { nowPassword: "", newPassword: "short", confirmPassword: "other" } });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "nowPassword", error: { type: "RAW_PASSWORD_EMPTY" } },
        { field: "newPassword", error: { type: "NEW_PASSWORD_TOO_SHORT", min: 8 } },
        { field: "confirmPassword", error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } },
      ],
    });
    expect(repository.findUser).not.toHaveBeenCalled();
    expect(repository.updatePassword).not.toHaveBeenCalled();
  });
});
