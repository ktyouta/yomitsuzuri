import { afterEach, describe, it, expect, vi } from "vitest";
import { VerifyUsecase } from "..";
import { Cookie, RefreshToken } from "../../../../domain/auth";
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

const PROFILE: UserProfile = {
  id: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  name: "testuser",
  birthday: "19900101",
  darkMode: true,
};

function createRepository(profile: UserProfile | undefined) {
  return {
    findById: vi.fn<IGetUserProfileRepository["findById"]>().mockResolvedValue(profile),
  } satisfies IGetUserProfileRepository;
}

describe("VerifyUsecase", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("トークンが正しくユーザーが存在する場合、successとアクセストークン・プロフィールを返すこと", async () => {
    const usecase = new VerifyUsecase(createRepository(PROFILE), testConfig);
    const refreshToken = await RefreshToken.create(UserId.of(PROFILE.id), testConfig);

    const result = await usecase.execute(refreshToken);

    expect(result.status).toBe("success");
    if (result.status !== "success") {
      return;
    }
    expect(result.dto.value.accessToken).toBeTruthy();
    expect(result.dto.value.user).toEqual(PROFILE);
  });

  it("トークンが不正な場合、例外になること", async () => {
    const usecase = new VerifyUsecase(createRepository(PROFILE), testConfig);
    const refreshToken = RefreshToken.get(new Cookie({ [RefreshToken.COOKIE_KEY]: "invalid-token" }), testConfig);

    await expect(usecase.execute(refreshToken)).rejects.toThrow();
  });

  it("ユーザーが存在しない場合、user_not_foundを返すこと", async () => {
    const usecase = new VerifyUsecase(createRepository(undefined), testConfig);
    const refreshToken = await RefreshToken.create(UserId.of(PROFILE.id), testConfig);

    const result = await usecase.execute(refreshToken);

    expect(result.status).toBe("user_not_found");
  });

  it("ログインから7日を過ぎている場合、expiredを返すこと", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    const usecase = new VerifyUsecase(createRepository(PROFILE), testConfig);

    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const loginToken = await RefreshToken.create(UserId.of(PROFILE.id), testConfig);
    // ログインから6日後に更新し、トークン自体の有効期限を延ばす
    vi.setSystemTime(new Date("2026-01-07T00:00:00Z"));
    const refreshedToken = await loginToken.refresh();
    // ログインから8日後（トークン自体の有効期限内だが、ログインから7日を過ぎている）
    vi.setSystemTime(new Date("2026-01-09T00:00:00Z"));

    const result = await usecase.execute(refreshedToken);

    expect(result.status).toBe("expired");
  });
});
