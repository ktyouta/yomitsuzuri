import { describe, it, expect } from "vitest";
import { CreateUserResultDto } from "..";
import { AccessToken, NewPassword, Pepper, RefreshToken, UserAggregate, UserName, UserBirthday } from "../../../../domain";
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

describe("CreateUserResultDto", () => {
  it("集約とトークンからDTOを生成できること", async () => {
    const user = await UserAggregate.generate({
      name: UserName.of("testuser"),
      birthday: UserBirthday.of("19900101"),
      password: NewPassword.create("password123")._unsafeUnwrap(),
      pepper: new Pepper(testConfig.pepper),
    });
    const accessToken = await AccessToken.create(user.id, testConfig);
    const refreshToken = await RefreshToken.create(user.id, testConfig);

    const dto = new CreateUserResultDto(user, accessToken, refreshToken);

    expect(dto.value.accessToken).toBe(accessToken.token);
    expect(dto.value.refreshToken).toBe(refreshToken.value);
    expect(dto.value.user.id).toBe(user.id.value);
    expect(dto.value.user.name).toBe("testuser");
    expect(dto.value.user.birthday).toBe("19900101");
    expect(dto.value.user.darkMode).toBe(false);
  });
});
