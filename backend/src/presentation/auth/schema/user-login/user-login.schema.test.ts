import { describe, it, expect } from "vitest";
import { UserLoginSchema } from "..";

const VALID_BODY = { name: "testuser", password: "password123" };

/**
 * 型・構造のみを検証する（空かどうかは値オブジェクトのテストで検証する）
 */
describe("UserLoginSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    expect(UserLoginSchema.safeParse(VALID_BODY).success).toBe(true);
  });

  it("値が空でも、型が正しければ通ること", () => {
    expect(UserLoginSchema.safeParse({ name: "", password: "" }).success).toBe(true);
  });

  it.each(["name", "password"])("%s がない場合、エラーになること", (key) => {
    const body: Record<string, unknown> = { ...VALID_BODY };
    delete body[key];
    expect(UserLoginSchema.safeParse(body).success).toBe(false);
  });

  it.each([{ name: 1 }, { password: 1 }])("型が異なる場合（%j）、エラーになること", (override) => {
    expect(UserLoginSchema.safeParse({ ...VALID_BODY, ...override }).success).toBe(false);
  });
});
