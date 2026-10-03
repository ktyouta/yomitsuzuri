import { describe, expect, it } from "vitest";
import { GetListBookQuerySchema } from "../../../../src/presentation/book/schema";

describe("GetListBookQuerySchema", () => {
  it("pageを省略した場合、1になること", () => {
    const result = GetListBookQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
    }
  });

  it("pageが数値文字列の場合、数値に変換されること", () => {
    const result = GetListBookQuerySchema.safeParse({ page: "2" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
    }
  });

  it.each(["0", "-1", "1.5", "abc", ""])("pageが「%s」の場合、エラーになること", (page) => {
    const result = GetListBookQuerySchema.safeParse({ page });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("ページ番号は1以上の整数で指定してください");
    }
  });
});
