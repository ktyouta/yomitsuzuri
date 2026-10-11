import { describe, it, expect, vi } from "vitest";
import { UpdatePasswordUsecase } from "..";
import { Pepper, UserLoginEntity, UserPassword, UserSalt } from "../../../../domain/auth";
import type { IUserPasswordRepository } from "../../../../domain/auth";
import { UserId, UserName } from "../../../../domain/shared";
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
const LOGIN_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const NOW_PASSWORD = "now-password";
const NEW_PASSWORD = "new-password";
const BODY = { nowPassword: NOW_PASSWORD, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD };

async function createCredential() {
  const salt = UserSalt.generate();
  const passwordHash = await UserPassword.hash(NOW_PASSWORD, salt, new Pepper(testConfig.pepper));
  return new UserLoginEntity(UserId.of(LOGIN_ID), UserId.of(USER_ID), UserName.of("testuser"), passwordHash, salt);
}

function createRepository(credential: UserLoginEntity | undefined, updated: boolean) {
  return {
    getLoginUser: vi.fn<IUserPasswordRepository["getLoginUser"]>().mockResolvedValue(credential),
    updateLoginUser: vi.fn<IUserPasswordRepository["updateLoginUser"]>().mockResolvedValue(updated),
  } satisfies IUserPasswordRepository;
}

describe("UpdatePasswordUsecase", () => {
  it("今のパスワードが正しい場合、新しいパスワードのハッシュで更新し、ok を返すこと", async () => {
    const credential = await createCredential();
    const repository = createRepository(credential, true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(UserId.of(USER_ID), BODY);

    expect(result.isOk()).toBe(true);
    expect(repository.updateLoginUser).toHaveBeenCalledTimes(1);
    const savedHash = repository.updateLoginUser.mock.calls[0]?.[1];
    const expectedHash = await UserPassword.hash(NEW_PASSWORD, UserSalt.of(credential.salt), new Pepper(testConfig.pepper));
    expect(savedHash?.value).toBe(expectedHash.value);
  });

  it("更新対象がなかった場合、NOT_FOUND を返すこと", async () => {
    const repository = createRepository(await createCredential(), false);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(UserId.of(USER_ID), BODY);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
  });

  it("資格情報が存在しない場合、NOT_FOUND を返し、パスワードを更新しないこと", async () => {
    const repository = createRepository(undefined, true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(UserId.of(USER_ID), BODY);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "NOT_FOUND" });
    expect(repository.updateLoginUser).not.toHaveBeenCalled();
  });

  it("今のパスワードが違う場合、CURRENT_PASSWORD_MISMATCH を返し、パスワードを更新しないこと", async () => {
    const repository = createRepository(await createCredential(), true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(UserId.of(USER_ID), { ...BODY, nowPassword: "wrong-password" });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "CURRENT_PASSWORD_MISMATCH" });
    expect(repository.updateLoginUser).not.toHaveBeenCalled();
  });

  it("入力値が制約を満たさない場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせず更新しないこと", async () => {
    const repository = createRepository(await createCredential(), true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(UserId.of(USER_ID), { nowPassword: "", newPassword: "short", confirmPassword: "other" });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "nowPassword", error: { type: "RAW_PASSWORD_EMPTY" } },
        { field: "newPassword", error: { type: "NEW_PASSWORD_TOO_SHORT", min: 8 } },
        { field: "confirmPassword", error: { type: "PASSWORD_CONFIRMATION_MISMATCH" } },
      ],
    });
    expect(repository.getLoginUser).not.toHaveBeenCalled();
    expect(repository.updateLoginUser).not.toHaveBeenCalled();
  });
});
