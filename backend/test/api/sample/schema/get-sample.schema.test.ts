import { describe, it, expect } from "vitest";
import { GetSampleParamSchema } from "../../../../src/presentation/sample/schema";

describe("GetSampleParamSchema", () => {
  it("正常なIDでバリデーションを通過すること", () => {
    const result = GetSampleParamSchema.safeParse({
      id: "123",
    });
    expect(result.success).toBe(true);
  });

  it("数値以外のIDでエラーになること", () => {
    const result = GetSampleParamSchema.safeParse({
      id: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("空のIDでエラーになること", () => {
    const result = GetSampleParamSchema.safeParse({
      id: "",
    });
    expect(result.success).toBe(false);
  });
});
