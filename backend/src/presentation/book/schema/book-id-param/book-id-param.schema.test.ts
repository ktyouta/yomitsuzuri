import { describe, expect, it } from "vitest";
import { BookIdParamSchema } from "..";

describe("BookIdParamSchema", () => {
  it("bookIdがULID形式の場合、そのまま通ること", () => {
    const result = BookIdParamSchema.safeParse({ bookId: "01BX5ZZKBKACTAV9WEVGEMMVRZ" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.bookId).toBe("01BX5ZZKBKACTAV9WEVGEMMVRZ");
    }
  });

  it.each([
    ["空文字", ""],
    ["25文字", "01BX5ZZKBKACTAV9WEVGEMMVR"],
    ["27文字", "01BX5ZZKBKACTAV9WEVGEMMVRZZ"],
    ["小文字を含む", "01bx5zzkbkactav9wevgemmvrz"],
    ["ULIDで使わない文字（I）を含む", "01BX5ZZKBKACTAV9WEVGEMMVRI"],
  ])("bookIdが%sの場合、エラーになること", (_, bookId) => {
    const result = BookIdParamSchema.safeParse({ bookId });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("書籍IDの形式が正しくありません");
    }
  });
});
