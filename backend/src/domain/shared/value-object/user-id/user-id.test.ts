import { describe, it, expect } from "vitest";
import { UserId } from "../../..";

describe("UserId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(userId.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => UserId.of("")).toThrow("ユーザーIDが設定されていません。");
  });

  it("createでULID（26文字）を生成できること", () => {
    const userId = UserId.create();
    expect(userId.value).toHaveLength(26);
  });

  it("createは毎回異なるIDを生成すること", () => {
    const id1 = UserId.create();
    const id2 = UserId.create();
    expect(id1.value).not.toBe(id2.value);
  });
});
