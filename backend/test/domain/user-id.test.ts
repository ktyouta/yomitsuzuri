import { describe, it, expect } from "vitest";
import { UserId } from "../../src/domain";

describe("UserId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const userId = UserId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(userId.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => UserId.of("")).toThrow("ユーザーIDが設定されていません。");
  });

  it("generateでULID（26文字）を生成できること", () => {
    const userId = UserId.generate();
    expect(userId.value).toHaveLength(26);
  });

  it("generateは毎回異なるIDを生成すること", () => {
    const id1 = UserId.generate();
    const id2 = UserId.generate();
    expect(id1.value).not.toBe(id2.value);
  });
});
