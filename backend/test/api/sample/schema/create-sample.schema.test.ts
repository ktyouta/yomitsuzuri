import { describe, it, expect } from "vitest";
import { CreateSampleSchema } from "../../../../src/presentation/sample/schema";

describe("CreateSampleSchema", () => {
  it("正常なデータでバリデーションを通過すること", () => {
    const result = CreateSampleSchema.safeParse({
      name: "テストサンプル",
      description: "説明文",
    });
    expect(result.success).toBe(true);
  });

  it("名前が空の場合にエラーになること", () => {
    const result = CreateSampleSchema.safeParse({
      name: "",
      description: "説明文",
    });
    expect(result.success).toBe(false);
  });

  it("名前が100文字を超える場合にエラーになること", () => {
    const result = CreateSampleSchema.safeParse({
      name: "a".repeat(101),
      description: "説明文",
    });
    expect(result.success).toBe(false);
  });

  it("説明が省略可能であること", () => {
    const result = CreateSampleSchema.safeParse({
      name: "テストサンプル",
    });
    expect(result.success).toBe(true);
  });
});
