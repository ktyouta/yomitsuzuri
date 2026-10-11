import { err, ok, type Result } from "neverthrow";

/**
 * ログイン時に入力するユーザー名の生成失敗
 */
export type LoginNameError = { type: "LOGIN_NAME_EMPTY" };

/**
 * ログイン時に入力するユーザー名（ユーザー名の文字数の制約は適用しない）
 */
export class LoginName {
  private readonly _value: string;

  /**
   * @param loginName 空でないユーザー名
   */
  private constructor(loginName: string) {
    this._value = loginName;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 外部からの入力値から生成する
   * @param loginName ユーザー名
   * @returns 成功時はログイン用のユーザー名、空の場合はその内容を持つ Result
   */
  static create(loginName: string): Result<LoginName, LoginNameError> {
    if (!loginName) {
      return err({ type: "LOGIN_NAME_EMPTY" });
    }

    return ok(new LoginName(loginName));
  }
}
