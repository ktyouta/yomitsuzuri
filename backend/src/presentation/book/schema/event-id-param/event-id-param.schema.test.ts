import { describe, expect, it } from "vitest";
import { EventIdParamSchema } from "..";

/**
 * 型のみを検証する（形式が不正・存在しない出来事IDは、出来事の取得で見つからないため 404 になる）
 */
describe("EventIdParamSchema", () => {
  it.each(["01BX5ZZKBKACTAV9WEVGEMMVT0", "invalid"])("eventIdが文字列（%s）の場合、そのまま通ること", (eventId) => {
    const result = EventIdParamSchema.safeParse({ eventId });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventId).toBe(eventId);
    }
  });

  it("eventIdがない場合、エラーになること", () => {
    const result = EventIdParamSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
