import { describe, it, expect } from "vitest";
import { BookId } from "../../../../src/domain";

describe("BookId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const id = BookId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(id.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => BookId.of("")).toThrow("書籍IDが設定されていません。");
  });

  it("generateでULID（26文字）を生成できること", () => {
    const id = BookId.generate();
    expect(id.value).toHaveLength(26);
  });

  it("generateは毎回異なるIDを生成すること", () => {
    const id1 = BookId.generate();
    const id2 = BookId.generate();
    expect(id1.value).not.toBe(id2.value);
  });
});
