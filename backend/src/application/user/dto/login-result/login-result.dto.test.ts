import { describe, it, expect } from "vitest";
import { LoginResultDto } from "..";
import { AccessToken, LoginCredentialId, LoginId, RefreshToken, UserAggregate, UserBirthday, UserName, UserPassword, UserSalt } from "../../../../domain/user";
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

describe("LoginResultDto", () => {
  it("ユーザーとトークンからDTOを生成できること（パスワード等のログイン情報は含めない）", async () => {
    const user = UserAggregate.reconstruct({
      id: UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV"),
      name: UserName.of("testuser"),
      birthday: UserBirthday.of("19900101"),
      darkMode: true,
      loginCredentialId: LoginCredentialId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ"),
      loginId: LoginId.of("testuser"),
      password: UserPassword.of("hashed"),
      salt: UserSalt.of("salt"),
      deleteFlg: false,
    });
    const accessToken = await AccessToken.create(user.id, testConfig);
    const refreshToken = await RefreshToken.create(user.id, testConfig);

    const dto = new LoginResultDto(user, accessToken, refreshToken);

    expect(dto.value.accessToken).toBe(accessToken.token);
    expect(dto.value.refreshToken).toBe(refreshToken.value);
    expect(dto.value.user).toEqual({
      id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      name: "testuser",
      birthday: "19900101",
      darkMode: true,
    });
  });
});
