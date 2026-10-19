import { describe, it, expect, vi } from "vitest";
import { LoginUsecase } from "..";
import { LoginCredentialId, LoginId, Pepper, UserAggregate, UserBirthday, UserPassword, UserSalt } from "../../../../domain/user";
import type { IUserLoginRepository } from "../../../../domain/user";
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

const LOGIN_CREDENTIAL_ID = "01ARZ3NDEKTSV4RRFFQ69G5FAW";
const PASSWORD = "correct-password";
const PROFILE = {
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "testuser",
  birthday: "19900101",
  darkMode: false,
};

async function createUser() {
  const salt = UserSalt.generate();
  const passwordHash = await UserPassword.hash(PASSWORD, salt, new Pepper(testConfig.pepper));
  return UserAggregate.reconstruct({
    id: UserId.of(PROFILE.id),
    name: UserName.of(PROFILE.name),
    birthday: UserBirthday.of(PROFILE.birthday),
    darkMode: PROFILE.darkMode,
    loginCredentialId: LoginCredentialId.of(LOGIN_CREDENTIAL_ID),
    loginId: LoginId.of(PROFILE.name),
    password: passwordHash,
    salt,
    deleteFlg: false,
  });
}

function createRepository(user: UserAggregate | null) {
  return {
    findUser: vi.fn<IUserLoginRepository["findUser"]>().mockResolvedValue(user),
    updateLastLoginDate: vi.fn<IUserLoginRepository["updateLastLoginDate"]>().mockResolvedValue(undefined),
  } satisfies IUserLoginRepository;
}

describe("LoginUsecase", () => {
  it("名前とパスワードが正しい場合、トークンとプロフィールを返し、最終ログイン日時を1回更新すること", async () => {
    const loginRepository = createRepository(await createUser());
    const usecase = new LoginUsecase(loginRepository, testConfig);

    const result = await usecase.execute({ name: PROFILE.name, password: PASSWORD });

    const dto = result._unsafeUnwrap();
    expect(dto.value.user).toEqual(PROFILE);
    expect(dto.value.accessToken).toBeTruthy();
    expect(dto.value.refreshToken).toBeTruthy();
    expect(loginRepository.updateLastLoginDate).toHaveBeenCalledTimes(1);
  });

  it("ユーザーが存在しない場合、AUTHENTICATION_FAILED を返し、最終ログイン日時を更新しないこと", async () => {
    const loginRepository = createRepository(null);
    const usecase = new LoginUsecase(loginRepository, testConfig);

    const result = await usecase.execute({ name: PROFILE.name, password: PASSWORD });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "AUTHENTICATION_FAILED" });
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("パスワードが違う場合、AUTHENTICATION_FAILED を返し、最終ログイン日時を更新しないこと", async () => {
    const loginRepository = createRepository(await createUser());
    const usecase = new LoginUsecase(loginRepository, testConfig);

    const result = await usecase.execute({ name: PROFILE.name, password: "wrong-password" });

    expect(result._unsafeUnwrapErr()).toEqual({ type: "AUTHENTICATION_FAILED" });
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("入力値が空の場合、INVALID_INPUT で違反をすべて項目名とともに返し、DB を問い合わせないこと", async () => {
    const loginRepository = createRepository(await createUser());
    const usecase = new LoginUsecase(loginRepository, testConfig);

    const result = await usecase.execute({ name: "", password: "" });

    expect(result._unsafeUnwrapErr()).toEqual({
      type: "INVALID_INPUT",
      errors: [
        { field: "name", error: { type: "LOGIN_ID_EMPTY" } },
        { field: "password", error: { type: "RAW_PASSWORD_EMPTY" } },
      ],
    });
    expect(loginRepository.findUser).not.toHaveBeenCalled();
    expect(loginRepository.updateLastLoginDate).not.toHaveBeenCalled();
  });

  it("入力した名前でユーザーを問い合わせること（ユーザー名の文字数は判定しない）", async () => {
    const loginRepository = createRepository(null);
    const usecase = new LoginUsecase(loginRepository, testConfig);

    await usecase.execute({ name: "ab", password: PASSWORD });

    expect(loginRepository.findUser.mock.calls[0]?.[0].value).toBe("ab");
  });
});
