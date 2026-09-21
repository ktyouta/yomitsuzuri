import { describe, it, expect } from "vitest";
import { AccessToken, Header } from "../../src/domain/auth";
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

/**
 * テスト用のモックRequestを作成
 */
function createMockRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/test", {
    headers: new Headers(headers),
  });
}

describe("AccessToken", () => {

  it("アクセストークンを生成できること", async () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const accessToken = await AccessToken.create(userId, testConfig);

    expect(accessToken.token).toBeDefined();
    expect(typeof accessToken.token).toBe("string");
  });

  it("JWT形式（3つのドット区切り）で生成されること", async () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const accessToken = await AccessToken.create(userId, testConfig);

    expect(accessToken.token.split(".")).toHaveLength(3);
  });

  it("異なるユーザーIDで異なるトークンが生成されること", async () => {
    const userId1 = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    const userId2 = UserId.of("01BX5ZZKBKACTAV9WEVGEMMVRZ");
    const token1 = await AccessToken.create(userId1, testConfig);
    const token2 = await AccessToken.create(userId2, testConfig);

    expect(token1.token).not.toBe(token2.token);
  });

  describe("get", () => {
    it("正常なヘッダからトークンを取得できること", async () => {
      const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
      const createdToken = await AccessToken.create(userId, testConfig);

      const request = createMockRequest({
        Authorization: `Bearer ${createdToken.token}`,
      });
      const header = new Header(request);
      const extractedToken = AccessToken.get(header, testConfig);

      expect(extractedToken.token).toBe(createdToken.token);
    });

    it("Authorizationヘッダ未設定の場合にエラーになること", () => {
      const request = createMockRequest({});
      const header = new Header(request);

      expect(() => AccessToken.get(header, testConfig)).toThrow(
        "Authorizationヘッダの形式が不正です。"
      );
    });

    it("不正な形式の場合にエラーになること", () => {
      const request = createMockRequest({
        Authorization: "InvalidFormat",
      });
      const header = new Header(request);

      expect(() => AccessToken.get(header, testConfig)).toThrow(
        "Authorizationヘッダの形式が不正です。"
      );
    });

    it("Bearer以外のスキームの場合にエラーになること", () => {
      const request = createMockRequest({
        Authorization: "Basic abc123",
      });
      const header = new Header(request);

      expect(() => AccessToken.get(header, testConfig)).toThrow(
        "Authorizationヘッダの形式が不正です。"
      );
    });

    it("Bearerとトークンの間にスペースがない場合にエラーになること", () => {
      const request = createMockRequest({
        Authorization: "Bearertoken123",
      });
      const header = new Header(request);

      expect(() => AccessToken.get(header, testConfig)).toThrow(
        "Authorizationヘッダの形式が不正です。"
      );
    });
  });

  describe("getPayload", () => {
    it("ユーザーIDを取得できること", async () => {
      const userId = UserId.of("01J9ZK8RCF3G4X7T9K2M5N6P8Q");
      const accessToken = await AccessToken.create(userId, testConfig);

      const extractedUserId = await accessToken.getPayload();
      expect(extractedUserId.value).toBe("01J9ZK8RCF3G4X7T9K2M5N6P8Q");
    });

    it("不正なキーの場合にエラーになること", async () => {
      const invalidToken = AccessToken.get(
        new Header(createMockRequest({ Authorization: "Bearer invalid.token.here" })),
        testConfig
      );

      await expect(invalidToken.getPayload()).rejects.toThrow();
    });
  });
});
