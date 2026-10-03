import { describe, it, expect } from "vitest";
import { UserLoginSchema } from "../../../../src/presentation/auth/schema";

describe("UserLogin Schema Validation", () => {
  describe("UserLoginSchema", () => {
    it("正常なデータでバリデーションを通過すること", () => {
      const result = UserLoginSchema.safeParse({
        name: "testuser",
        password: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("ユーザー名が空の場合にエラーになること", () => {
      const result = UserLoginSchema.safeParse({
        name: "",
        password: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "ユーザー名を入力してください"
        );
      }
    });

    it("パスワードが空の場合にエラーになること", () => {
      const result = UserLoginSchema.safeParse({
        name: "testuser",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "パスワードを入力してください"
        );
      }
    });

    it("ユーザー名とパスワードが両方空の場合に複数エラーになること", () => {
      const result = UserLoginSchema.safeParse({
        name: "",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues).toHaveLength(2);
      }
    });
  });
});
