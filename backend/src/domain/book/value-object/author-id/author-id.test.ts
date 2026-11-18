import { describe, it, expect } from "vitest";
import { AuthorId } from "../../..";

describe("AuthorId", () => {
  it("ofで既存のID（ULID文字列）からインスタンスを生成できること", () => {
    const id = AuthorId.of("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    expect(id.value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
  });

  it("空文字でエラーになること", () => {
    expect(() => AuthorId.of("")).toThrow("著者IDが設定されていません。");
  });

  it("createでULID（26文字）を生成できること", () => {
    const id = AuthorId.create();
    expect(id.value).toHaveLength(26);
  });

  it("createは毎回異なるIDを生成すること", () => {
    const id1 = AuthorId.create();
    const id2 = AuthorId.create();
    expect(id1.value).not.toBe(id2.value);
  });

  describe("fromInput", () => {
    it("入力値から生成できること", () => {
      expect(AuthorId.fromInput("01ARZ3NDEKTSV4RRFFQ69G5FAV")._unsafeUnwrap().value).toBe("01ARZ3NDEKTSV4RRFFQ69G5FAV");
    });

    it("空文字の場合、AUTHOR_ID_EMPTY を返すこと", () => {
      expect(AuthorId.fromInput("")._unsafeUnwrapErr()).toEqual({ type: "AUTHOR_ID_EMPTY" });
    });
  });
});
