import { ulid } from "ulid";

/**
 * ユーザーID（ULID）
 */
export class UserId {
  private readonly _value: string;

  private constructor(userId: string) {
    if (!userId) {
      throw new Error("ユーザーIDが設定されていません。");
    }
    this._value = userId;
  }

  get value(): string {
    return this._value;
  }

  /**
   * ULIDでユーザーIDを生成
   */
  static generate(): UserId {
    return new UserId(ulid());
  }

  /**
   * 既存のユーザーIDからインスタンスを生成
   * @param userId ユーザーID
   */
  static of(userId: string): UserId {
    return new UserId(userId);
  }
}
