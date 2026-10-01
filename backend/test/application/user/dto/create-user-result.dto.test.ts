import { describe, it, expect } from "vitest";
import { CreateUserResultDto } from "../../../../src/application/user/dto";
import { AccessToken, RefreshToken, UserEntity, UserId, UserName, UserBirthday } from "../../../../src/domain";
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

describe("CreateUserResultDto", () => {
  it("エンティティとトークンからDTOを生成できること", async () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const userName = new UserName("testuser");
    const userBirthday = new UserBirthday("19900101");
    const entity = new UserEntity(userId, userName, userBirthday);
    const accessToken = await AccessToken.create(userId, testConfig);
    const refreshToken = await RefreshToken.create(userId, testConfig);

    const dto = new CreateUserResultDto(entity, accessToken, refreshToken);

    expect(dto.value.accessToken).toBe(accessToken.token);
    expect(dto.value.refreshToken).toBe(refreshToken.value);
    expect(dto.value.user.id).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(dto.value.user.name).toBe("testuser");
    expect(dto.value.user.birthday).toBe("19900101");
    expect(dto.value.user.darkMode).toBe(false);
  });
});
