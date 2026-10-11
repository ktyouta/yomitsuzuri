import { describe, expect, it } from "vitest";
import { BookIdParamSchema } from "..";

/**
 * 型のみを検証する（形式が不正・存在しない書籍IDは、書籍の取得で見つからないため 404 になる）
 */
describe("BookIdParamSchema", () => {
  it.each(["01BX5ZZKBKACTAV9WEVGEMMVRZ", "invalid"])("bookIdが文字列（%s）の場合、そのまま通ること", (bookId) => {
    const result = BookIdParamSchema.safeParse({ bookId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bookId).toBe(bookId);
    }
  });

  it("bookIdがない場合、エラーになること", () => {
    const result = BookIdParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
