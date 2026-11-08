import { describe, expect, it } from "vitest";
import { UpdateWorkSchema } from "..";

const VALID_BODY = {
  title: "作品1",
  memo: "メモ",
  iconId: 2,
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクト、作品名の重複は集約のテストで検証する）
 */
describe("UpdateWorkSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    const result = UpdateWorkSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("メモが null・未指定の場合、通ること", () => {
    const { memo: _memo, ...body } = VALID_BODY;
    expect(UpdateWorkSchema.safeParse(body).success).toBe(true);
    expect(UpdateWorkSchema.safeParse({ ...body, memo: null }).success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = UpdateWorkSchema.safeParse({ ...VALID_BODY, title: "", iconId: 0 });
    expect(result.success).toBe(true);
  });

  it.each(["title", "iconId", "updatedAt"])("%s がない場合、エラーになること", (key) => {
    const body: Record<string, unknown> = { ...VALID_BODY };
    delete body[key];
    expect(UpdateWorkSchema.safeParse(body).success).toBe(false);
  });

  it.each([
    { title: 1 },
    { memo: 1 },
    { iconId: "2" },
    { updatedAt: 1 },
  ])("型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateWorkSchema.safeParse({ ...VALID_BODY, ...override });
    expect(result.success).toBe(false);
  });
});
