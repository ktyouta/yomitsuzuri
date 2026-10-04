import { describe, it, expect } from "vitest";
import { BookTitle } from "../../..";

describe("BookTitle", () => {
  it("正常なタイトルでインスタンスを生成できること", () => {
    const title = new BookTitle("容疑者Xの献身");
    expect(title.value).toBe("容疑者Xの献身");
  });

  it("前後の空白を除去して保持すること", () => {
    const title = new BookTitle("  容疑者Xの献身　");
    expect(title.value).toBe("容疑者Xの献身");
  });

  it("上限文字数ちょうどで生成できること", () => {
    const title = new BookTitle("あ".repeat(BookTitle.TITLE_MAX_LENGTH));
    expect(title.value).toHaveLength(BookTitle.TITLE_MAX_LENGTH);
  });

  it("空文字でエラーになること", () => {
    expect(() => new BookTitle("")).toThrow("書籍タイトルが設定されていません。");
  });

  it("空白のみでエラーになること", () => {
    expect(() => new BookTitle("   ")).toThrow("書籍タイトルが設定されていません。");
  });

  it("上限文字数を超えるとエラーになること", () => {
    expect(() => new BookTitle("あ".repeat(BookTitle.TITLE_MAX_LENGTH + 1))).toThrow(
      `書籍タイトルは${BookTitle.TITLE_MAX_LENGTH}文字以内で入力してください。`
    );
  });
});
