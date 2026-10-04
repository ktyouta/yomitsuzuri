export type UpdateUserDarkModeResultType = {
  darkMode: boolean;
};

/**
 * ユーザーダークモード設定更新結果 DTO
 */
export class UpdateUserDarkModeResultDto {
  private readonly _value: UpdateUserDarkModeResultType;

  /**
   * @param darkMode 更新後のダークモード設定
   */
  constructor(darkMode: boolean) {
    this._value = { darkMode };
  }

  get value(): UpdateUserDarkModeResultType {
    return this._value;
  }
}
