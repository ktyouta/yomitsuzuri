import { describe, it, expect } from "vitest";
import { Header } from "../../src/domain/auth";

/**
 * テスト用のモックRequestを作成
 */
function createMockRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/test", {
    headers: new Headers(headers),
  });
}

describe("Header", () => {
  describe("constructor", () => {
    it("Requestからヘッダーを取得できること", () => {
      const request = createMockRequest({
        "Content-Type": "application/json",
      });

      const header = new Header(request);

      expect(header.headers.get("Content-Type")).toBe("application/json");
    });

    it("リクエストが存在しない場合にエラーになること", () => {
      expect(() => new Header(null as unknown as Request)).toThrow(
        "リクエストが存在しません。"
      );
    });
  });

  describe("get", () => {
    it("ヘッダーの値を取得できること", () => {
      const request = createMockRequest({
        Authorization: "Bearer token123",
      });

      const header = new Header(request);

      expect(header.get("Authorization")).toBe("Bearer token123");
    });

    it("ヘッダー名が大文字でも小文字でも取得できること", () => {
      const request = createMockRequest({
        Authorization: "Bearer token123",
      });

      const header = new Header(request);

      expect(header.get("authorization")).toBe("Bearer token123");
      expect(header.get("AUTHORIZATION")).toBe("Bearer token123");
    });

    it("存在しないヘッダーの場合はnullを返すこと", () => {
      const request = createMockRequest({});

      const header = new Header(request);

      expect(header.get("Authorization")).toBeNull();
    });
  });

  describe("headers getter", () => {
    it("内部のHeadersオブジェクトを取得できること", () => {
      const request = createMockRequest({
        "X-Custom-Header": "custom-value",
      });

      const header = new Header(request);

      expect(header.headers.get("X-Custom-Header")).toBe("custom-value");
    });
  });
});
