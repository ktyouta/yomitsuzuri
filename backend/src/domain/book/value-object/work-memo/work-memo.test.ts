import { describe, it, expect } from "vitest";
import { WorkMemo } from "../../..";

describe("WorkMemo", () => {
  it("正常なメモでインスタンスを生成できること", () => {
    const memo = new WorkMemo("犯人は最初から登場している");
    expect(memo.value).toBe("犯人は最初から登場している");
  });

  it("前後の空白を除去して保持すること", () => {
    const memo = new WorkMemo("  犯人は最初から登場している\n");
    expect(memo.value).toBe("犯人は最初から登場している");
  });

  it("上限文字数ちょうどで生成できること", () => {
    const memo = new WorkMemo("あ".repeat(WorkMemo.MEMO_MAX_LENGTH));
    expect(memo.value).toHaveLength(WorkMemo.MEMO_MAX_LENGTH);
  });

  it("上限文字数を超えるとエラーになること", () => {
    expect(() => new WorkMemo("あ".repeat(WorkMemo.MEMO_MAX_LENGTH + 1))).toThrow(
      `作品メモは${WorkMemo.MEMO_MAX_LENGTH}文字以内で入力してください。`
    );
  });

  it("nullの場合はnullを保持すること", () => {
    expect(new WorkMemo(null).value).toBeNull();
  });

  it("undefinedの場合はnullを保持すること", () => {
    expect(new WorkMemo(undefined).value).toBeNull();
  });

  it("空文字の場合はnullを保持すること", () => {
    expect(new WorkMemo("").value).toBeNull();
  });

  it("空白のみの場合はnullを保持すること", () => {
    expect(new WorkMemo("   ").value).toBeNull();
  });
});
