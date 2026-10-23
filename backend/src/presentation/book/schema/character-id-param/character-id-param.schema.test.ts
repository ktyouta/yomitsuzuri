import { describe, expect, it } from "vitest";
import { CharacterIdParamSchema } from "..";

/**
 * 型のみを検証する（形式が不正・存在しない登場人物IDは、登場人物の取得で見つからないため 404 になる）
 */
describe("CharacterIdParamSchema", () => {
  it.each(["01BX5ZZKBKACTAV9WEVGEMMVT0", "invalid"])("characterIdが文字列（%s）の場合、そのまま通ること", (characterId) => {
    const result = CharacterIdParamSchema.safeParse({ characterId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.characterId).toBe(characterId);
    }
  });

  it("characterIdがない場合、エラーになること", () => {
    const result = CharacterIdParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
