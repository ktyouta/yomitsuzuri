import { describe, it, expect } from "vitest";
import { LoginResultDto } from "../../../../src/application/auth/dto";
import { AccessToken, RefreshToken } from "../../../../src/domain/auth";
import { UserId } from "../../../../src/domain/user";
import type { UserProfile } from "../../../../src/domain/user";
import type { EnvConfig } from "../../../../src/config";

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
  it("プロフィールとトークンからDTOを生成できること", async () => {
    const profile: UserProfile = {
      id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
      name: "testuser",
      birthday: "19900101",
      darkMode: true,
    };
    const userId = UserId.of(profile.id);
    const accessToken = await AccessToken.create(userId, testConfig);
    const refreshToken = await RefreshToken.create(userId, testConfig);

    const dto = new LoginResultDto(profile, accessToken, refreshToken);

    expect(dto.value.accessToken).toBe(accessToken.token);
    expect(dto.value.refreshToken).toBe(refreshToken.value);
    expect(dto.value.user.id).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(dto.value.user.name).toBe("testuser");
    expect(dto.value.user.birthday).toBe("19900101");
    expect(dto.value.user.darkMode).toBe(true);
  });
});
