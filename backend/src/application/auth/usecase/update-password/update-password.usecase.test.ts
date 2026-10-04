import { describe, it, expect, vi } from "vitest";
import { UpdatePasswordUsecase } from "..";
import { Pepper, UserLoginEntity, UserPassword, UserSalt } from "../../../../domain/auth";
import type { IUserPasswordRepository } from "../../../../domain/auth";
import { UserName } from "../../../../domain/user";
import { UserId } from "../../../../domain/shared";
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

async function createCredential() {
  const salt = UserSalt.generate();
  const passwordHash = await UserPassword.hash(NOW_PASSWORD, salt, new Pepper(testConfig.pepper));
  return new UserLoginEntity(UserId.of(LOGIN_ID), UserId.of(USER_ID), new UserName("testuser"), passwordHash, salt);
}

function createRepository(credential: UserLoginEntity | undefined, updated: boolean) {
  return {
    getLoginUser: vi.fn<IUserPasswordRepository["getLoginUser"]>().mockResolvedValue(credential),
    updateLoginUser: vi.fn<IUserPasswordRepository["updateLoginUser"]>().mockResolvedValue(updated),
  } satisfies IUserPasswordRepository;
}

describe("UpdatePasswordUsecase", () => {
  it("今のパスワードが正しい場合、新しいパスワードのハッシュで更新し、trueを返すこと", async () => {
    const credential = await createCredential();
    const repository = createRepository(credential, true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(USER_ID, NOW_PASSWORD, NEW_PASSWORD);

    expect(result).toBe(true);
    expect(repository.updateLoginUser).toHaveBeenCalledTimes(1);
    const savedHash = repository.updateLoginUser.mock.calls[0]?.[1];
    const expectedHash = await UserPassword.hash(NEW_PASSWORD, UserSalt.of(credential.salt), new Pepper(testConfig.pepper));
    expect(savedHash?.value).toBe(expectedHash.value);
  });

  it("更新できなかった場合、falseを返すこと", async () => {
    const repository = createRepository(await createCredential(), false);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(USER_ID, NOW_PASSWORD, NEW_PASSWORD);

    expect(result).toBe(false);
  });

  it("ユーザーが存在しない場合、falseを返し、パスワードを更新しないこと", async () => {
    const repository = createRepository(undefined, true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(USER_ID, NOW_PASSWORD, NEW_PASSWORD);

    expect(result).toBe(false);
    expect(repository.updateLoginUser).not.toHaveBeenCalled();
  });

  it("今のパスワードが違う場合、falseを返し、パスワードを更新しないこと", async () => {
    const repository = createRepository(await createCredential(), true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    const result = await usecase.execute(USER_ID, "wrong-password", NEW_PASSWORD);

    expect(result).toBe(false);
    expect(repository.updateLoginUser).not.toHaveBeenCalled();
  });

  it("ユーザーIDが空の場合、例外になり、パスワードを更新しないこと", async () => {
    const repository = createRepository(await createCredential(), true);
    const usecase = new UpdatePasswordUsecase(repository, testConfig);

    await expect(usecase.execute("", NOW_PASSWORD, NEW_PASSWORD)).rejects.toThrow();
    expect(repository.updateLoginUser).not.toHaveBeenCalled();
  });
});
