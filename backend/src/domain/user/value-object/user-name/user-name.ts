import { err, ok, type Result } from "neverthrow";

/**
 * ユーザー名の生成失敗
 */
export type UserNameError = { type: "USER_NAME_TOO_SHORT"; min: number }
  | { type: "USER_NAME_TOO_LONG"; max: number };

/**
 * ユーザー名
 */
export class UserName {
  static readonly MIN_LENGTH = 3;
  static readonly MAX_LENGTH = 30;
  private readonly _value: string;

  /**
   * @param userName ユーザー名
   */
  private constructor(userName: string) {
    this._value = userName;
  }

  get value(): string {
    return this._value;
  }

  /**
   * 外部からの入力値から生成する
   * @param userName ユーザー名
   * @returns 成功時はユーザー名、文字数が範囲外の場合はその内容を持つ Result
   */
  static create(userName: string): Result<UserName, UserNameError> {
    if (userName.length < UserName.MIN_LENGTH) {
      return err({ type: "USER_NAME_TOO_SHORT", min: UserName.MIN_LENGTH });
    }

    if (userName.length > UserName.MAX_LENGTH) {
      return err({ type: "USER_NAME_TOO_LONG", max: UserName.MAX_LENGTH });
    }

    return ok(new UserName(userName));
  }

  /**
   * 永続化済みの値など、制約を満たすことが保証された値から生成する
   * @param userName ユーザー名
   * @returns ユーザー名
   * @throws 制約を満たさない場合（呼び出し側の不具合）
   */
  static of(userName: string): UserName {
    return UserName.create(userName).match(
      (name) => name,
      (error) => { throw new Error(`ユーザー名が不正です。type:${error.type}`); },
    );
  }
}
