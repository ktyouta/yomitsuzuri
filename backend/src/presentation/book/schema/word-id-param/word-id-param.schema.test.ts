import { describe, expect, it } from "vitest";
import { WordIdParamSchema } from "..";

/**
 * 型のみを検証する（形式が不正・存在しない気になるワードIDは、気になるワードの取得で見つからないため 404 になる）
 */
describe("WordIdParamSchema", () => {
  it.each(["01BX5ZZKBKACTAV9WEVGEMMVT0", "invalid"])("wordIdが文字列（%s）の場合、そのまま通ること", (wordId) => {
    const result = WordIdParamSchema.safeParse({ wordId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.wordId).toBe(wordId);
    }
  });

  it("wordIdがない場合、エラーになること", () => {
    const result = WordIdParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
