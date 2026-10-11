import { describe, expect, it } from "vitest";
import { UpdateUserSchema } from "./update-user.schema";

const VALID_BODY = { name: "testuser", birthday: "19900101" };

/**
 * 型・構造のみを検証する（値の制約は値オブジェクトのテストで検証する）
 */
describe("UpdateUserSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    expect(UpdateUserSchema.safeParse(VALID_BODY).success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること", () => {
    expect(UpdateUserSchema.safeParse({ name: "ab", birthday: "1990-01-01" }).success).toBe(true);
  });

  it.each(["name", "birthday"])("%s がない場合、エラーになること", (key) => {
    const body: Record<string, unknown> = { ...VALID_BODY };
    delete body[key];
    expect(UpdateUserSchema.safeParse(body).success).toBe(false);
  });

  it.each([{ name: 1 }, { birthday: 19900101 }])("型が異なる場合（%j）、エラーになること", (override) => {
    expect(UpdateUserSchema.safeParse({ ...VALID_BODY, ...override }).success).toBe(false);
  });
});
