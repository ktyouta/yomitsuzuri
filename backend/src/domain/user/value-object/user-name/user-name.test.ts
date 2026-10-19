import { describe, it, expect } from "vitest";
import { UserName } from "../../..";

describe("UserName", () => {
  describe("create", () => {
    it("正常な名前で生成できること", () => {
      expect(UserName.create("testuser")._unsafeUnwrap().value).toBe("testuser");
    });

    it("日本語の名前でも生成できること", () => {
      expect(UserName.create("テストユーザー")._unsafeUnwrap().value).toBe("テストユーザー");
    });

    it.each([UserName.MIN_LENGTH, UserName.MAX_LENGTH])("%s文字ちょうどで生成できること", (length) => {
      expect(UserName.create("あ".repeat(length))._unsafeUnwrap().value).toHaveLength(length);
    });

    it.each(["", "ab"])("「%s」の場合、USER_NAME_TOO_SHORT を最小文字数とともに返すこと", (name) => {
      expect(UserName.create(name)._unsafeUnwrapErr()).toEqual({ type: "USER_NAME_TOO_SHORT", min: UserName.MIN_LENGTH });
    });

    it("最大文字数を超える場合、USER_NAME_TOO_LONG を最大文字数とともに返すこと", () => {
      expect(UserName.create("あ".repeat(UserName.MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "USER_NAME_TOO_LONG",
        max: UserName.MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(UserName.of("testuser").value).toBe("testuser");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => UserName.of("")).toThrow();
    });
  });
});
