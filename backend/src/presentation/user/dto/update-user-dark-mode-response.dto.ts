export type UpdateUserDarkModeResponseType = {
  darkMode: boolean;
};

export class UpdateUserDarkModeResponseDto {
  private readonly _value: UpdateUserDarkModeResponseType;

  constructor(darkMode: boolean) {
    this._value = { darkMode };
  }

  get value(): UpdateUserDarkModeResponseType {
    return this._value;
  }
}
