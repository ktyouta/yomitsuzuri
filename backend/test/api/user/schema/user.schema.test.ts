import { describe, expect, it } from "vitest";
import {
  CreateUserSchema,
  UpdateUserSchema,
} from "../../../../src/presentation/user/schema";

describe("User Schema Validation", () => {
  describe("CreateUserSchema", () => {
    it("正常なデータでバリデーションを通過すること", () => {
      const result = CreateUserSchema.safeParse({
        name: "testuser",
        birthday: "19900101",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(true);
    });

    it("ユーザー名が3文字未満の場合にエラーになること", () => {
      const result = CreateUserSchema.safeParse({
        name: "ab",
        birthday: "19900101",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "ユーザー名は3文字以上で入力してください"
        );
      }
    });

    it("ユーザー名が30文字を超える場合にエラーになること", () => {
      const result = CreateUserSchema.safeParse({
        name: "a".repeat(31),
        birthday: "19900101",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "ユーザー名は30文字以内で入力してください"
        );
      }
    });

    it("生年月日が不正な形式の場合にエラーになること", () => {
      const result = CreateUserSchema.safeParse({
        name: "testuser",
        birthday: "1990-01-01",
        password: "password123",
        confirmPassword: "password123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "生年月日は日付形式(yyyyMMdd)で入力してください"
        );
      }
    });

    it("パスワードが8文字未満の場合にエラーになること", () => {
      const result = CreateUserSchema.safeParse({
        name: "testuser",
        birthday: "19900101",
        password: "pass123",
        confirmPassword: "pass123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "パスワードは8文字以上で入力してください"
        );
      }
    });

    it("パスワードに全角文字が含まれる場合にエラーになること", () => {
      const result = CreateUserSchema.safeParse({
        name: "testuser",
        birthday: "19900101",
        password: "パスワード123",
        confirmPassword: "パスワード123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "パスワードは半角英数記号で入力してください"
        );
      }
    });

    it("確認用パスワードが一致しない場合にエラーになること", () => {
      const result = CreateUserSchema.safeParse({
        name: "testuser",
        birthday: "19900101",
        password: "password123",
        confirmPassword: "password456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "確認用パスワードが一致しません。"
        );
      }
    });
  });

  describe("UpdateUserSchema", () => {
    it("正常なデータでバリデーションを通過すること", () => {
      const result = UpdateUserSchema.safeParse({
        name: "updateduser",
        birthday: "19950515",
      });
      expect(result.success).toBe(true);
    });

    it("ユーザー名が3文字未満の場合にエラーになること", () => {
      const result = UpdateUserSchema.safeParse({
        name: "ab",
        birthday: "19950515",
      });
      expect(result.success).toBe(false);
    });

    it("生年月日が不正な形式の場合にエラーになること", () => {
      const result = UpdateUserSchema.safeParse({
        name: "updateduser",
        birthday: "invalid",
      });
      expect(result.success).toBe(false);
    });
  });
});
