import { describe, expect, it } from "vitest";
import { CreateUserSchema } from "./create-user.schema";

const VALID_BODY = {
  name: "testuser",
  birthday: "19900101",
  password: "password123",
  confirmPassword: "password123",
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクト、確認用パスワードの一致は Usecase のテストで検証する）
 */
describe("CreateUserSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    expect(CreateUserSchema.safeParse(VALID_BODY).success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること", () => {
    const result = CreateUserSchema.safeParse({ name: "ab", birthday: "1990-01-01", password: "short", confirmPassword: "other" });
    expect(result.success).toBe(true);
  });

  it.each(["name", "birthday", "password", "confirmPassword"])("%s がない場合、エラーになること", (key) => {
    const body: Record<string, unknown> = { ...VALID_BODY };
    delete body[key];
    expect(CreateUserSchema.safeParse(body).success).toBe(false);
  });

  it.each([{ name: 1 }, { birthday: 19900101 }, { password: 1 }, { confirmPassword: 1 }])("型が異なる場合（%j）、エラーになること", (override) => {
    expect(CreateUserSchema.safeParse({ ...VALID_BODY, ...override }).success).toBe(false);
  });
});
