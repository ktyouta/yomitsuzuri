import { describe, it, expect } from "vitest";
import { Cookie, RefreshToken } from "../../src/domain/auth";
import { UserId } from "../../src/domain/user";
import type { EnvConfig } from "../../src/config";

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

describe("RefreshToken", () => {

  it("リフレッシュトークンを生成できること", async () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const refreshToken = await RefreshToken.create(userId, testConfig);

    expect(refreshToken.value).toBeDefined();
    expect(typeof refreshToken.value).toBe("string");
  });

  it("JWT形式（3つのドット区切り）で生成されること", async () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const refreshToken = await RefreshToken.create(userId, testConfig);

    expect(refreshToken.value.split(".")).toHaveLength(3);
  });

  describe("get", () => {
    it("Cookieからトークンを取得できること", async () => {
      const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
      const createdToken = await RefreshToken.create(userId, testConfig);

      const cookie = new Cookie({ [RefreshToken.COOKIE_KEY]: createdToken.value });
      const extractedToken = RefreshToken.get(cookie, testConfig);
      expect(extractedToken.value).toBe(createdToken.value);
    });

    it("Cookieにトークンが存在しない場合にエラーになること", () => {
      const cookie = new Cookie({});
      expect(() => RefreshToken.get(cookie, testConfig)).toThrow(
        "トークンが存在しません。"
      );
    });
  });

  describe("getPayload", () => {
    it("ユーザーIDを取得できること", async () => {
      const userId = UserId.of("01J9ZK8RCF3G4X7T9K2M5N6P8Q");
      const refreshToken = await RefreshToken.create(userId, testConfig);

      const extractedUserId = await refreshToken.getPayload();
      expect(extractedUserId.value).toBe("01J9ZK8RCF3G4X7T9K2M5N6P8Q");
    });
  });

  describe("isAbsoluteExpired", () => {
    it("期限内の場合にfalseを返すこと", async () => {
      const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
      const refreshToken = await RefreshToken.create(userId, testConfig);

      const isExpired = await refreshToken.isAbsoluteExpired();
      expect(isExpired).toBe(false);
    });
  });

  describe("refresh", () => {
    it("新しいトークンを生成できること", async () => {
      const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
      const originalToken = await RefreshToken.create(userId, testConfig);

      const newToken = await originalToken.refresh();

      expect(newToken.value).toBeDefined();
      expect(newToken.value.split(".")).toHaveLength(3);
    });

    it("refresh後もユーザーIDが保持されること", async () => {
      const userId = UserId.of("01HZXK3P7Q9M2N4R6S8T0V1W3Y");
      const originalToken = await RefreshToken.create(userId, testConfig);

      const newToken = await originalToken.refresh();
      const extractedUserId = await newToken.getPayload();

      expect(extractedUserId.value).toBe("01HZXK3P7Q9M2N4R6S8T0V1W3Y");
    });
  });

  describe("COOKIE_KEY", () => {
    it("Cookie名が正しいこと", () => {
      expect(RefreshToken.COOKIE_KEY).toBe("refresh_token");
    });
  });

  describe("getCookieSetOption", () => {
    it("Cookieオプションを取得できること", () => {
      const options = RefreshToken.getCookieSetOption(testConfig);

      expect(options.httpOnly).toBe(true);
      expect(options.path).toBe("/");
      expect(typeof options.maxAge).toBe("number");
    });
  });

  describe("getCookieClearOption", () => {
    it("クリアオプションを取得できること", () => {
      const options = RefreshToken.getCookieClearOption(testConfig);

      expect(options.httpOnly).toBe(true);
      expect(options.maxAge).toBe(0);
      expect(options.path).toBe("/");
    });
  });
});
