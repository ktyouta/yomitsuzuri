import type { AccessToken, RefreshToken } from "../../../../domain/auth";

export type RefreshResultType = {
  accessToken: string;
  refreshToken: string;
};

/**
 * トークンリフレッシュ結果 DTO
 */
export class RefreshResultDto {
  private readonly _value: RefreshResultType;

  /**
   * @param accessToken 発行したアクセストークン
   * @param refreshToken 再発行したリフレッシュトークン
   */
  constructor(accessToken: AccessToken, refreshToken: RefreshToken) {
    this._value = {
      accessToken: accessToken.token,
      refreshToken: refreshToken.value,
    };
  }

  get value(): RefreshResultType {
    return this._value;
  }
}
