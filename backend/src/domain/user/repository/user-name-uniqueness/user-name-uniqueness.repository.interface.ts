import type { UserId } from "../../../shared";
import type { UserName } from "../../value-object";

/**
 * ユーザー名一意性判定リポジトリインターフェース
 */
export interface IUserNameUniquenessRepository {
    /**
     * 同名ユーザーの取得（未削除のもの）
     * userId 自身は判定対象から除外する（更新時の自己重複を防ぐ）。
     * @param userId 判定対象から除外するユーザーID
     * @param userName ユーザー名
     * @returns 同名ユーザーの ID 一覧
     */
    findUser(userId: UserId, userName: UserName): Promise<{ id: string }[]>;
}
