/**
 * ペッパー（アプリケーション共通シークレット）
 */
export class Pepper {
  private readonly _value: string;

  constructor(pepperValue: string) {
    if (!pepperValue) {
      throw new Error("PEPPERが設定されていません。");
    }
    this._value = pepperValue;
  }

  get value(): string {
    return this._value;
  }
}
