import { describe, it, expect } from "vitest";
import { BookMemo } from "../../../../src/domain";

describe("BookMemo", () => {
  it("正常なメモでインスタンスを生成できること", () => {
    const memo = new BookMemo("犯人は最初から登場している");
    expect(memo.value).toBe("犯人は最初から登場している");
  });

  it("前後の空白を除去して保持すること", () => {
    const memo = new BookMemo("  犯人は最初から登場している\n");
    expect(memo.value).toBe("犯人は最初から登場している");
  });

  it("上限文字数ちょうどで生成できること", () => {
    const memo = new BookMemo("あ".repeat(BookMemo.MEMO_MAX_LENGTH));
    expect(memo.value).toHaveLength(BookMemo.MEMO_MAX_LENGTH);
  });

  it("上限文字数を超えるとエラーになること", () => {
    expect(() => new BookMemo("あ".repeat(BookMemo.MEMO_MAX_LENGTH + 1))).toThrow(
      `書籍メモは${BookMemo.MEMO_MAX_LENGTH}文字以内で入力してください。`
    );
  });

  it("nullの場合はnullを保持すること", () => {
    expect(new BookMemo(null).value).toBeNull();
  });

  it("undefinedの場合はnullを保持すること", () => {
    expect(new BookMemo(undefined).value).toBeNull();
  });

  it("空文字の場合はnullを保持すること", () => {
    expect(new BookMemo("").value).toBeNull();
  });

  it("空白のみの場合はnullを保持すること", () => {
    expect(new BookMemo("   ").value).toBeNull();
  });
});
