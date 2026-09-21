import { describe, it, expect } from "vitest";
import { UpdateSampleSchema, UpdateSampleParamSchema } from "../../../../src/presentation/sample/schema";

describe("UpdateSampleSchema", () => {
  it("部分更新が可能であること", () => {
    const result = UpdateSampleSchema.safeParse({
      name: "更新後の名前",
    });
    expect(result.success).toBe(true);
  });

  it("空のオブジェクトでもバリデーションを通過すること", () => {
    const result = UpdateSampleSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe("UpdateSampleParamSchema", () => {
  it("正常なIDでバリデーションを通過すること", () => {
    const result = UpdateSampleParamSchema.safeParse({
      id: "123",
    });
    expect(result.success).toBe(true);
  });

  it("数値以外のIDでエラーになること", () => {
    const result = UpdateSampleParamSchema.safeParse({
      id: "abc",
    });
    expect(result.success).toBe(false);
  });
});
