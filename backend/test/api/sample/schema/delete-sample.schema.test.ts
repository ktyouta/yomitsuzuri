import { describe, it, expect } from "vitest";
import { DeleteSampleParamSchema } from "../../../../src/presentation/sample/schema";

describe("DeleteSampleParamSchema", () => {
  it("正常なIDでバリデーションを通過すること", () => {
    const result = DeleteSampleParamSchema.safeParse({
      id: "123",
    });
    expect(result.success).toBe(true);
  });

  it("数値以外のIDでエラーになること", () => {
    const result = DeleteSampleParamSchema.safeParse({
      id: "abc",
    });
    expect(result.success).toBe(false);
  });

  it("空のIDでエラーになること", () => {
    const result = DeleteSampleParamSchema.safeParse({
      id: "",
    });
    expect(result.success).toBe(false);
  });
});
