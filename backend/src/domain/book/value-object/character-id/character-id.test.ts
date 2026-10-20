import { describe, it, expect } from "vitest";
import { CharacterId } from "../../..";

describe("CharacterId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const id = CharacterId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(id.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => CharacterId.of("")).toThrow("登場人物IDが設定されていません。");
  });

  it("createでULID（26文字）を生成できること", () => {
    const id = CharacterId.create();
    expect(id.value).toHaveLength(26);
  });

  it("createは毎回異なるIDを生成すること", () => {
    const id1 = CharacterId.create();
    const id2 = CharacterId.create();
    expect(id1.value).not.toBe(id2.value);
  });
});
