import { describe, expect, it } from "vitest";
import { UpdateBookSchema } from "..";

const WORK = { id: "01ARZ3NDEKTSV4RRFFQ69G5FAX", title: "作品1", sort: 1, memo: "メモ", deleteFlg: false };

const VALID_BODY = {
  title: "容疑者Xの献身",
  publishedDate: "2005-08",
  readingStatus: 2,
  currentPage: 120,
  memo: "メモ",
  iconId: 2,
  works: [WORK],
};

describe("UpdateBookSchema", () => {
  it("全項目を指定した場合、通ること", () => {
    const result = UpdateBookSchema.safeParse(VALID_BODY);
    expect(result.success).toBe(true);
  });

  it("作品IDが null（新規の作品）・作品メモが未指定の場合、通ること", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ id: null, title: "作品1", sort: 1, deleteFlg: false }] });
    expect(result.success).toBe(true);
  });

  it("書籍項目は書籍作成と同じ規則で検証すること（タイトルが空白のみの場合、エラーになること）", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, title: "   " });
    expect(result.success).toBe(false);
  });

  it.each([0, 1.5])("読書状況が%sの場合、エラーになること", (readingStatus) => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, readingStatus });
    expect(result.success).toBe(false);
  });

  it.each([0, 1.5])("アイコンIDが%sの場合、エラーになること", (iconId) => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, iconId });
    expect(result.success).toBe(false);
  });

  it("作品が0件の場合、エラーになること", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [] });
    expect(result.success).toBe(false);
  });

  it("作品IDが ULID 形式でない場合、エラーになること", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ ...WORK, id: "invalid" }] });
    expect(result.success).toBe(false);
  });

  it.each(["", "   ", "あ".repeat(101)])("作品タイトルが「%s」の場合、エラーになること", (title) => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ ...WORK, title }] });
    expect(result.success).toBe(false);
  });

  it("作品タイトルが100文字の場合、通ること", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ ...WORK, title: "あ".repeat(100) }] });
    expect(result.success).toBe(true);
  });

  it.each([0, 1.5])("表示順が%sの場合、エラーになること", (sort) => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ ...WORK, sort }] });
    expect(result.success).toBe(false);
  });

  it("新規の作品（作品IDが null）が削除済みの場合、エラーになること", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [WORK, { ...WORK, id: null, deleteFlg: true }] });
    expect(result.success).toBe(false);
  });

  it("作品IDが重複している場合、エラーになること", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [WORK, { ...WORK, title: "作品2", sort: 2 }] });
    expect(result.success).toBe(false);
  });

  it("新規の作品が複数ある場合（作品IDが null 同士）、重複扱いにならないこと", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ ...WORK, id: null }, { ...WORK, id: null, title: "作品2", sort: 2 }] });
    expect(result.success).toBe(true);
  });

  it("作品メモが2001文字の場合、エラーになること", () => {
    const result = UpdateBookSchema.safeParse({ ...VALID_BODY, works: [{ ...WORK, memo: "あ".repeat(2001) }] });
    expect(result.success).toBe(false);
  });
});
