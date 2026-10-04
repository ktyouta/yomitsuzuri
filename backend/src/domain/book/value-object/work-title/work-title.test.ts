import { describe, it, expect } from "vitest";
import { WorkTitle } from "../../..";

describe("WorkTitle", () => {
  it("正常なタイトルでインスタンスを生成できること", () => {
    const title = new WorkTitle("容疑者Xの献身");
    expect(title.value).toBe("容疑者Xの献身");
  });

  it("前後の空白を除去して保持すること", () => {
    const title = new WorkTitle("  容疑者Xの献身　");
    expect(title.value).toBe("容疑者Xの献身");
  });

  it("上限文字数ちょうどで生成できること", () => {
    const title = new WorkTitle("あ".repeat(WorkTitle.TITLE_MAX_LENGTH));
    expect(title.value).toHaveLength(WorkTitle.TITLE_MAX_LENGTH);
  });

  it("空文字でエラーになること", () => {
    expect(() => new WorkTitle("")).toThrow("作品タイトルが設定されていません。");
  });

  it("空白のみでエラーになること", () => {
    expect(() => new WorkTitle("   ")).toThrow("作品タイトルが設定されていません。");
  });

  it("上限文字数を超えるとエラーになること", () => {
    expect(() => new WorkTitle("あ".repeat(WorkTitle.TITLE_MAX_LENGTH + 1))).toThrow(
      `作品タイトルは${WorkTitle.TITLE_MAX_LENGTH}文字以内で入力してください。`
    );
  });
});
