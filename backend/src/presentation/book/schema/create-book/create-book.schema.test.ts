import { describe, expect, it } from "vitest";
import { CreateBookSchema } from "..";

const VALID_BODY = {
  title: "容疑者Xの献身",
  publishedDate: "2005-08",
  currentPage: 120,
  memo: "メモ",
  icon: 2,
};

describe("CreateBookSchema", () => {
  it("タイトルとアイコンのみの場合、通ること", () => {
    const result = CreateBookSchema.safeParse({ title: "容疑者Xの献身", icon: 1 });
    expect(result.success).toBe(true);
  });

  it("全項目を指定した場合、通ること", () => {
    const result = CreateBookSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("出版日・現在のページ数・メモが null の場合、通ること", () => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, publishedDate: null, currentPage: null, memo: null });
    expect(result.success).toBe(true);
  });

  it.each(["", "   ", "あ".repeat(101)])("タイトルが「%s」の場合、エラーになること", (title) => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, title });
    expect(result.success).toBe(false);
  });

  it("タイトルが100文字の場合、通ること", () => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, title: "あ".repeat(100) });
    expect(result.success).toBe(true);
  });

  it.each(["2005/08", "2005-13", "2025-02-30"])("出版日が「%s」の場合、エラーになること", (publishedDate) => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, publishedDate });
    expect(result.success).toBe(false);
  });

  it.each([-1, 1.5])("現在のページ数が%sの場合、エラーになること", (currentPage) => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, currentPage });
    expect(result.success).toBe(false);
  });

  it("メモが2001文字の場合、エラーになること", () => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, memo: "あ".repeat(2001) });
    expect(result.success).toBe(false);
  });

  it.each([0, 1.5])("アイコンが%sの場合、エラーになること", (icon) => {
    const result = CreateBookSchema.safeParse({ ...VALID_BODY, icon });
    expect(result.success).toBe(false);
  });
});
