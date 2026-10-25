import { describe, it, expect } from "vitest";
import { WordId } from "../../..";

describe("WordId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const id = WordId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(id.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => WordId.of("")).toThrow("気になるワードIDが設定されていません。");
  });

  it("createでULID（26文字）を生成できること", () => {
    const id = WordId.create();
    expect(id.value).toHaveLength(26);
  });

  it("createは毎回異なるIDを生成すること", () => {
    const id1 = WordId.create();
    const id2 = WordId.create();
    expect(id1.value).not.toBe(id2.value);
  });
});
