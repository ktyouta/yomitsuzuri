import { describe, it, expect } from "vitest";
import { LoginName } from "../../..";

describe("LoginName", () => {
  describe("create", () => {
    it.each(["a", "testuser", "あ".repeat(31)])("空でなければ（%s）、そのまま保持すること（ユーザー名の文字数は判定しない）", (name) => {
      expect(LoginName.create(name)._unsafeUnwrap().value).toBe(name);
    });

    it("空の場合、LOGIN_NAME_EMPTY を返すこと", () => {
      expect(LoginName.create("")._unsafeUnwrapErr()).toEqual({ type: "LOGIN_NAME_EMPTY" });
    });
  });
});
