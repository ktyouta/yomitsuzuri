import { describe, expect, it } from "vitest";
import { UpdateEventSchema } from "..";

const VALID_BODY = {
  occurredTiming: "3日目の夜",
  content: "屋敷の主人が書斎で倒れているのが見つかる",
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクトのテストで検証する）
 */
describe("UpdateEventSchema", () => {
  it("内容のみの場合、通ること", () => {
    const result = UpdateEventSchema.safeParse({ content: VALID_BODY.content });
    expect(result.success).toBe(true);
  });

  it("全項目を指定した場合、通ること", () => {
    const result = UpdateEventSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("発生タイミングが null の場合、通ること", () => {
    const result = UpdateEventSchema.safeParse({ ...VALID_BODY, occurredTiming: null });
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = UpdateEventSchema.safeParse({ ...VALID_BODY, content: "" });
    expect(result.success).toBe(true);
  });

  it("内容がない場合、エラーになること", () => {
    const result = UpdateEventSchema.safeParse({ occurredTiming: VALID_BODY.occurredTiming });
    expect(result.success).toBe(false);
  });

  it.each([
    { occurredTiming: 1 },
    { content: 1 },
  ])("型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateEventSchema.safeParse({ ...VALID_BODY, ...override });
    expect(result.success).toBe(false);
  });
});
