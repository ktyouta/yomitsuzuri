import { describe, it, expect, vi } from "vitest";
import { LoginUsecase } from "..";
import { Pepper, UserLoginEntity, UserPassword, UserSalt } from "../../../../domain/auth";
import type { IUserLoginRepository } from "../../../../domain/auth";
import { UserId, UserName } from "../../../../domain/shared";
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
  return new UserLoginEntity(UserId.of(LOGIN_ID), UserId.of(PROFILE.id), UserName.of(PROFILE.name), passwordHash, salt);
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

    const dto = result._unsafeUnwrap();
    expect(dto.value.user).toEqual(PROFILE);
    expect(dto.value.accessToken).toBeTruthy();
    expect(dto.value.refreshToken).toBeTruthy();
    expect(loginRepository.updateLastLoginDate).toHaveBeenCalledTimes(1);
  });

  it("ユーザーが存在しない場合、AUTHENTICATION_FAILED を返し、最終ログイン日時を更新しないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(undefined, PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute(PROFILE.name, PASSWORD);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "AUTHENTICATION_FAILED" });
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("パスワードが違う場合、AUTHENTICATION_FAILED を返し、最終ログイン日時を更新しないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(await createCredential(), PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute(PROFILE.name, "wrong-password");

    expect(result._unsafeUnwrapErr()).toEqual({ type: "AUTHENTICATION_FAILED" });
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("プロフィールが存在しない場合、AUTHENTICATION_FAILED を返し、最終ログイン日時を更新しないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(await createCredential(), undefined);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute(PROFILE.name, PASSWORD);

    expect(result._unsafeUnwrapErr()).toEqual({ type: "AUTHENTICATION_FAILED" });
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("入力値が空の場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせないこと", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(await createCredential(), PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    const result = await usecase.execute("", "");

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "LOGIN_NAME_EMPTY" } },
        { field: "password", error: { type: "RAW_PASSWORD_EMPTY" } },
      ],
    });
    expect(loginRepository.getLoginUser).not.toHaveBeenCalled();
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("入力した名前で資格情報を問い合わせること（ユーザー名の文字数は判定しない）", async () => {
    const { loginRepository, userProfileRepository } = createRepositories(undefined, PROFILE);
    const usecase = new LoginUsecase(loginRepository, userProfileRepository, testConfig);

    await usecase.execute("ab", PASSWORD);

    expect(loginRepository.getLoginUser.mock.calls[0]?.[0].value).toBe("ab");
  });
});
