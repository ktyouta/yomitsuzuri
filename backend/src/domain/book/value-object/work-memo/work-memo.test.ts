import { describe, it, expect } from "vitest";
import { WorkMemo } from "../../..";

describe("WorkMemo", () => {
  describe("create", () => {
    it("正常なメモで生成できること", () => {
      expect(WorkMemo.create("犯人は最初から登場している")._unsafeUnwrap().value).toBe("犯人は最初から登場している");
    });

    it("前後の空白を除去して保持すること", () => {
      expect(WorkMemo.create("  犯人は最初から登場している\n")._unsafeUnwrap().value).toBe("犯人は最初から登場している");
    });

    it("上限文字数ちょうどで生成できること", () => {
      expect(WorkMemo.create("あ".repeat(WorkMemo.MEMO_MAX_LENGTH))._unsafeUnwrap().value).toHaveLength(WorkMemo.MEMO_MAX_LENGTH);
    });

    it.each([null, undefined, "", "   "])("%j の場合は null を保持すること", (memo) => {
      expect(WorkMemo.create(memo)._unsafeUnwrap().value).toBeNull();
    });

    it("上限文字数を超える場合、WORK_MEMO_TOO_LONG を上限文字数とともに返すこと", () => {
      expect(WorkMemo.create("あ".repeat(WorkMemo.MEMO_MAX_LENGTH + 1))._unsafeUnwrapErr()).toEqual({
        type: "WORK_MEMO_TOO_LONG",
        max: WorkMemo.MEMO_MAX_LENGTH,
      });
    });
  });

  describe("of", () => {
    it("制約を満たす値で生成できること", () => {
      expect(WorkMemo.of("メモ").value).toBe("メモ");
      expect(WorkMemo.of(null).value).toBeNull();
    });

    it("制約を満たさない値の場合は throw すること", () => {
      expect(() => WorkMemo.of("あ".repeat(WorkMemo.MEMO_MAX_LENGTH + 1))).toThrow();
    });
  });
});
