import { describe, expect, it } from "vitest";
import { DeleteWorkSchema } from "..";

const VALID_BODY = {
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクトのテストで検証する）
 */
describe("DeleteWorkSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    const result = DeleteWorkSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = DeleteWorkSchema.safeParse({ updatedAt: "2026-01-01" });
    expect(result.success).toBe(true);
  });

  it("updatedAt がない場合、エラーになること", () => {
    const result = DeleteWorkSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it.each([
    { updatedAt: 1 },
    { updatedAt: null },
  ])("型が異なる場合（%j）、エラーになること", (body) => {
    const result = DeleteWorkSchema.safeParse(body);
    expect(result.success).toBe(false);
  });
});
