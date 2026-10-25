import { describe, expect, it } from "vitest";
import { UpdateWordSchema } from "..";

const VALID_BODY = {
  text: "赤い手帳",
  memo: "メモ",
  page: 42,
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクトのテストで検証する）
 */
describe("UpdateWordSchema", () => {
  it("ワードのみの場合、通ること", () => {
    const result = UpdateWordSchema.safeParse({ text: "赤い手帳" });
    expect(result.success).toBe(true);
  });

  it("全項目を指定した場合、通ること", () => {
    const result = UpdateWordSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("ワード以外が null の場合、通ること", () => {
    const result = UpdateWordSchema.safeParse({ text: "赤い手帳", memo: null, page: null });
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = UpdateWordSchema.safeParse({ ...VALID_BODY, text: "", page: 0 });
    expect(result.success).toBe(true);
  });

  it("ワードがない場合、エラーになること", () => {
    const result = UpdateWordSchema.safeParse({ memo: "メモ" });
    expect(result.success).toBe(false);
  });

  it.each([
    { text: 1 },
    { memo: 1 },
    { page: "1" },
  ])("型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateWordSchema.safeParse({ ...VALID_BODY, ...override });
    expect(result.success).toBe(false);
  });
});
