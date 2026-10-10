import { describe, expect, it } from "vitest";
import { CreateBookSchema } from "..";

const VALID_BODY = {
  title: "容疑者Xの献身",
  publishedDate: "2005-08",
  currentPage: 120,
  memo: "メモ",
  icon: 2,
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクトのテストで検証する）
 */
describe("CreateBookSchema", () => {
  it("タイトルとアイコンのみの場合、通ること", () => {
    const result = CreateBookSchema.safeParse({ title: "容疑者Xの献身", icon: 1 });
    expect(result.success).toBe(true);
  });

  it("全項目を指定した場合、通ること", () => {
    const result = CreateBookSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("出版日・現在のページ数・メモが null の場合、通ること", () => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, publishedDate: null, currentPage: null, memo: null });
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, title: "", currentPage: -1, icon: 0 });
    expect(result.success).toBe(true);
  });

  it("タイトルがない場合、エラーになること", () => {
    const result = CreateBookSchema.safeParse({ icon: 1 });
    expect(result.success).toBe(false);
  });

  it("アイコンがない場合、エラーになること", () => {
    const result = CreateBookSchema.safeParse({ title: "容疑者Xの献身" });
    expect(result.success).toBe(false);
  });

  it.each([
    { title: 1 },
    { publishedDate: 2005 },
    { currentPage: "120" },
    { memo: 1 },
    { icon: "2" },
  ])("型が異なる場合（%j）、エラーになること", (override) => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, ...override });
    expect(result.success).toBe(false);
  });
});
