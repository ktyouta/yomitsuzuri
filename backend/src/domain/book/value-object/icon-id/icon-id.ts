export class IconId {

  static readonly MIN_VALUE = 1;
  private readonly _value: number;

  constructor(iconId: number) {
    if (!Number.isInteger(iconId) || iconId < IconId.MIN_VALUE) {
      throw new Error(`アイコンIDが不正です。iconId:${iconId}`);
    }
    this._value = iconId;
  }

  get value() {
    return this._value;
  }
}