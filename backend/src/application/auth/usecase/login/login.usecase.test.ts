import { describe, it, expect, vi } from "vitest";
import { LoginUsecase } from "..";
import { Pepper, UserLoginEntity, UserPassword, UserSalt } from "../../../../domain/auth";
import type { IUserLoginRepository } from "../../../../domain/auth";
import { UserName } from "../../../../domain/user";
import { UserId } from "../../../../domain/shared";
import type { IGetUserProfileRepository, UserProfile } from "../../../../domain/user";
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

const LOGIN_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const PASSWORD = "correct-password";
const PROFILE: UserProfile = {
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "testuser",
  birthday: "19900101",
  darkMode: false,
};

async function createCredential() {
  const salt = UserSalt.generate();
  const passwordHash = await UserPassword.hash(PASSWORD, salt, new Pepper(testConfig.pepper));
  return new UserLoginEntity(UserId.of(LOGIN_ID), UserId.of(PROFILE.id), new UserName(PROFILE.name), passwordHash, salt);
}

function createRepositories(credential: UserLoginEntity | undefined, profile: UserProfile | undefined) {
  const loginRepository = {
    getLoginUser: vi.fn<IUserLoginRepository["getLoginUser"]>().mockResolvedValue(credential),
    updateLastLoginDate: vi.fn<IUserLoginRepository["updateLastLoginDate"]>().mockResolvedValue(undefined),
  } satisfies IUserLoginRepository;
  const userProfileRepository = {
    findById: vi.fn<IGetUserProfileRepository["findById"]>().mockResolvedValue(profile),
  } satisfies IGetUserProfileRepository;
  return { loginRepository, userProfileRepository };
}

describe("LoginUsecase", () => {
  it("名前とパスワードが正しい場合、トークンとプロフィールを返し、最終ログイン日時を1回更新すること", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(await createCredential(), PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute(PROFILE.name, PASSWORD);

    expect(result?.value.user).toEqual(PROFILE);
    expect(result?.value.accessToken).toBeTruthy();
    expect(result?.value.refreshToken).toBeTruthy();
    expect(loginRepository.updateLastLoginDate).toHaveBeenCalledTimes(1);
  });

  it("ユーザーが存在しない場合、nullを返し、最終ログイン日時を更新しないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(undefined, PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute(PROFILE.name, PASSWORD);

    expect(result).toBeNull();
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("パスワードが違う場合、nullを返し、最終ログイン日時を更新しないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(await createCredential(), PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute(PROFILE.name, "wrong-password");

    expect(result).toBeNull();
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("プロフィールが存在しない場合、nullを返し、最終ログイン日時を更新しないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(await createCredential(), undefined);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute(PROFILE.name, PASSWORD);

    expect(result).toBeNull();
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("名前が空の場合、例外になり、最終ログイン日時を更新しないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(await createCredential(), PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    await expect(usecase.execute("", PASSWORD)).rejects.toThrow();
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });
});
