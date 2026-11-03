import { describe, expect, it } from "vitest";
import { CharacterRelationIdParamSchema } from "..";

/**
 * 型のみを検証する（形式が不正・存在しない登場人物関係IDは、登場人物関係の照合で見つからないため 404 になる）
 */
describe("CharacterRelationIdParamSchema", () => {
  it.each(["01BX5ZZKBKACTAV9WEVGEMMVR0", "invalid"])("relationIdが文字列（%s）の場合、そのまま通ること", (relationId) => {
    const result = CharacterRelationIdParamSchema.safeParse({ relationId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.relationId).toBe(relationId);
    }
  });

  it("relationIdがない場合、エラーになること", () => {
    const result = CharacterRelationIdParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
