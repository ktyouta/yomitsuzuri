import { describe, expect, it } from "vitest";
import { GetListDeletedBookQuerySchema } from "..";

/**
 * 文字列→数値の変換と省略時の既定値のみを検証する（ページ番号として正しいかは値オブジェクトのテストで検証する）
 */
describe("GetListDeletedBookQuerySchema", () => {
  it("pageを省略した場合、1になること", () => {
    const result = GetListDeletedBookQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("pageが数値文字列の場合、数値に変換されること", () => {
    const result = GetListDeletedBookQuerySchema.safeParse({ page: "2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it.each([["0", 0], ["1.5", 1.5], ["", 0]])("pageが「%s」の場合も判定せず、数値に変換して通すこと", (page, expected) => {
    const result = GetListDeletedBookQuerySchema.safeParse({ page });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(expected);
    }
  });

  it("pageが数値に変換できない場合も判定せず、NaN として通すこと", () => {
    const result = GetListDeletedBookQuerySchema.safeParse({ page: "abc" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBeNaN();
    }
  });
});
