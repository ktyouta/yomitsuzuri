import type { UserId } from "../value-object";

/**
 * ユーザープロフィール（認証結果等で使う軽量な参照専用データ）
 */
export type UserProfile = {
  id: string;
  name: string;
  birthday: string;
  darkMode: boolean;
};

/**
 * ユーザープロフィール取得リポジトリインターフェース
 */
export interface IGetUserProfileRepository {
  /**
   * ユーザーIDでプロフィールを取得
   */
  findById(userId: UserId): Promise<UserProfile | undefined>;
}
