import { describe, expect, it } from "vitest";
import { UpdateEventOrderSchema } from "..";

const VALID_EVENT = { id: "01BX5ZZKBKACTAV9WEVGEMMVT0", sortOrder: 1 };

/**
 * 型・構造のみを検証する（値の制約は値オブジェクト・集約のテストで検証する）
 */
describe("UpdateEventOrderSchema", () => {
  it("出来事を指定した場合、通ること", () => {
    const result = UpdateEventOrderSchema.safeParse({ events: [VALID_EVENT] });
    expect(result.success).toBe(true);
  });

  it("出来事が空の配列の場合、通ること（作品内の出来事との照合は集約で判定する）", () => {
    const result = UpdateEventOrderSchema.safeParse({ events: [] });
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = UpdateEventOrderSchema.safeParse({ events: [{ id: "", sortOrder: 0 }] });
    expect(result.success).toBe(true);
  });

  it("出来事がない場合、エラーになること", () => {
    const result = UpdateEventOrderSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("ボディが配列の場合、エラーになること", () => {
    const result = UpdateEventOrderSchema.safeParse([VALID_EVENT]);
    expect(result.success).toBe(false);
  });

  it.each([
    { id: 1 },
    { sortOrder: "1" },
  ])("出来事の型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateEventOrderSchema.safeParse({ events: [{ ...VALID_EVENT, ...override }] });
    expect(result.success).toBe(false);
  });

  it.each([{ id: VALID_EVENT.id }, { sortOrder: VALID_EVENT.sortOrder }])("出来事の項目が欠けている場合（%j）、エラーになること", (event) => {
    const result = UpdateEventOrderSchema.safeParse({ events: [event] });
    expect(result.success).toBe(false);
  });
});
