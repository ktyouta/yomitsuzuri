import { describe, expect, it } from "vitest";
import { WorkIdParamSchema } from "..";

/**
 * 型のみを検証する（形式が不正・存在しない作品IDは、作品の取得で見つからないため 404 になる）
 */
describe("WorkIdParamSchema", () => {
  it.each(["01BX5ZZKBKACTAV9WEVGEMMVS0", "invalid"])("workIdが文字列（%s）の場合、そのまま通ること", (workId) => {
    const result = WorkIdParamSchema.safeParse({ workId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.workId).toBe(workId);
    }
  });

  it("workIdがない場合、エラーになること", () => {
    const result = WorkIdParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
