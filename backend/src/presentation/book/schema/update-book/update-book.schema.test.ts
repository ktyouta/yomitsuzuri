import { describe, expect, it } from "vitest";
import { UpdateBookSchema } from "..";

const WORK = { id: "01ARZ3NDEKTSV4RRFFQ69G5FAX", sort: 1 };

const VALID_BODY = {
  title: "容疑者Xの献身",
  publishedDate: "2005-08",
  readingStatus: 2,
  currentPage: 120,
  memo: "メモ",
  iconId: 2,
  works: [WORK],
  updatedAt: "2026-01-01T00:00:00.000Z",
};

/**
 * 型・構造のみを検証する（値の制約は値オブジェクト、作品の指定の妥当性は集約のテストで検証する）
 */
describe("UpdateBookSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    const result = UpdateBookSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("出版日・現在のページ数・メモが null・未指定の場合、通ること", () => {
    const { publishedDate: _publishedDate, ...body } = VALID_BODY;
    const result = UpdateBookSchema.safeParse({ ...body, currentPage: null, memo: null });
    expect(result.success).toBe(true);
  });

  it("値の制約を満たさなくても、型が正しければ通ること（制約はドメインで判定する）", () => {
    const result = UpdateBookSchema.safeParse({
      ...VALID_BODY,
      title: "",
      readingStatus: 0,
      iconId: 0,
      works: [{ id: "invalid", sort: 0 }],
    });
    expect(result.success).toBe(true);
  });

  it("作品の指定の妥当性（0件・ID重複）は判定しないこと（集約で判定する）", () => {
    expect(UpdateBookSchema.safeParse({ ...VALID_BODY, works: [] }).success).toBe(true);
    expect(UpdateBookSchema.safeParse({ ...VALID_BODY, works: [WORK, WORK] }).success).toBe(true);
  });

  it.each(["title", "readingStatus", "iconId", "works", "updatedAt"])("%s がない場合、エラーになること", (key) => {
    const body: Record<string, unknown> = { ...VALID_BODY };
    delete body[key];
    expect(UpdateBookSchema.safeParse(body).success).toBe(false);
  });

  it.each(["id", "sort"])("作品の %s がない場合、エラーになること", (key) => {
    const work: Record<string, unknown> = { ...WORK };
    delete work[key];
    expect(UpdateBookSchema.safeParse({ ...VALID_BODY, works: [work] }).success).toBe(false);
  });

  it.each([
    { title: 1 },
    { publishedDate: 2005 },
    { readingStatus: "2" },
    { currentPage: "120" },
    { memo: 1 },
    { iconId: "2" },
    { works: {} },
    { updatedAt: 1 },
  ])("型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, ...override });
    expect(result.success).toBe(false);
  });

  it.each([
    { id: 1 },
    { id: null },
    { sort: "1" },
  ])("作品の型が異なる場合（%j）、エラーになること", (override) => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ ...WORK, ...override }] });
    expect(result.success).toBe(false);
  });
});
