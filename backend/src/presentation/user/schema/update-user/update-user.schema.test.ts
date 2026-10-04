import { describe, expect, it } from "vitest";
import { UpdateUserSchema } from "./update-user.schema";

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
