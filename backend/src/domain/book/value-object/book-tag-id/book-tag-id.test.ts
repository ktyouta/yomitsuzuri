import { describe, it, expect } from "vitest";
import { BookTagId } from "../../..";

describe("BookTagId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const id = BookTagId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(id.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => BookTagId.of("")).toThrow("書籍タグIDが設定されていません。");
  });

  it("createでULID（26文字）を生成できること", () => {
    const id = BookTagId.create();
    expect(id.value).toHaveLength(26);
  });

  it("createは毎回異なるIDを生成すること", () => {
    const id1 = BookTagId.create();
    const id2 = BookTagId.create();
    expect(id1.value).not.toBe(id2.value);
  });
});
