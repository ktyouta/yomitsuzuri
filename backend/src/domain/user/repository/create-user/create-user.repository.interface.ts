import type { UserAggregate } from "../../aggregate";

/**
 * ユーザー作成リポジトリインターフェース
 */
export interface ICreateUserRepository {
  /**
   * ユーザーとログイン情報をアトミックに作成する
   */
  createUser(user: UserAggregate): Promise<void>;
}
