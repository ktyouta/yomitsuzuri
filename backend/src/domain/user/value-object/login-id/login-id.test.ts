import { describe, it, expect } from "vitest";
import { LoginId } from "../../..";

describe("LoginId", () => {
  describe("create", () => {
    it.each(["a", "testuser", "あ".repeat(31)])("空でなければ（%s）、そのまま保持すること（ユーザー名の文字数は判定しない）", (name) => {
      expect(LoginId.create(name)._unsafeUnwrap().value).toBe(name);
    });

    it("空の場合、LOGIN_ID_EMPTY を返すこと", () => {
      expect(LoginId.create("")._unsafeUnwrapErr()).toEqual({ type: "LOGIN_ID_EMPTY" });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(LoginId.of("testuser").value).toBe("testuser");
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => LoginId.of("")).toThrow();
    });
  });
});
