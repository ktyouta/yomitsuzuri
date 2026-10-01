import type { RefreshToken } from "../../../domain/auth";
import type { UserEntity } from "../../../domain/user";

export type UpdateUserResultType = {
  refreshToken: string;
  user: {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
  };
};

/**
 * ユーザー更新結果 DTO
 */
export class UpdateUserResultDto {
  private readonly _value: UpdateUserResultType;

  /**
   * @param entity 更新後のユーザー
   * @param darkMode ユーザーのダークモード設定
   * @param refreshToken 再発行したリフレッシュトークン
   */
  constructor(entity: UserEntity, darkMode: boolean, refreshToken: RefreshToken) {
    this._value = {
      refreshToken: refreshToken.value,
      user: {
        id: entity.userId,
        name: entity.userName,
        birthday: entity.userBirthday,
        darkMode,
      },
    };
  }

  get value(): UpdateUserResultType {
    return this._value;
  }
}
