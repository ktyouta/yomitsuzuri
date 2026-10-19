import type { UserId } from "../../../shared";
import type { IUserNameUniquenessRepository } from "../../repository";
import type { UserName } from "../../value-object";

/**
 * ユーザー名一意性判定ドメインサービス
 */
export class UserNameUniquenessDomainService {

    constructor(private readonly userNameUniquenessRepository: IUserNameUniquenessRepository) { }

    /**
     * 同名ユーザーの重複判定。
     * userId 自身は除外するため、作成・更新のどちらも同じ問い合わせで判定できる。
     * @param userId 判定対象から除外するユーザーID
     * @param userName ユーザー名
     * @returns 同名のユーザー（未削除・userId 以外）が存在する場合 true
     */
    async isDuplicated(userId: UserId, userName: UserName): Promise<boolean> {
        const result = await this.userNameUniquenessRepository.findUser(userId, userName);
        return result.length > 0;
    }
}
