import type { AccessToken, RefreshToken } from "../../../domain/auth";
import type { UserEntity } from "../../../domain/user";

export type CreateUserResultType = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
  };
};

/**
 * ユーザー作成結果 DTO
 */
export class CreateUserResultDto {
  private readonly _value: CreateUserResultType;

  /**
   * @param entity 作成したユーザー
   * @param accessToken 発行したアクセストークン
   * @param refreshToken 発行したリフレッシュトークン
   */
  constructor(entity: UserEntity, accessToken: AccessToken, refreshToken: RefreshToken) {
    this._value = {
      accessToken: accessToken.token,
      refreshToken: refreshToken.value,
      user: {
        id: entity.userId,
        name: entity.userName,
        birthday: entity.userBirthday,
        // 新規作成直後はDBスキーマの既定値（false）と必ず一致する
        darkMode: false,
      },
    };
  }

  get value(): CreateUserResultType {
    return this._value;
  }
}
