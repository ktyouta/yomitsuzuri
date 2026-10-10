import { err, ok, type Result } from "neverthrow";

/**
 * アイコンIDの生成失敗
 */
export type IconIdError = { type: "ICON_ID_INVALID" };

/**
 * アイコンID（icon_master の ID）
 */
export class IconId {

  static readonly MIN_VALUE = 1;
  private readonly _value: number;

  /**
   * @param iconId アイコンID
   */
  private constructor(iconId: number) {
    this._value = iconId;
  }

  get value() {
    return this._value;
  }

  /**
   * 外部からの入力値から生成する（icon_master に存在するかは判定しない）
   * @param iconId アイコンID
   * @returns 成功時はアイコンID、MIN_VALUE 以上の整数でない場合はその内容を持つ Result
   */
  static create(iconId: number): Result<IconId, IconIdError> {
    if (!Number.isInteger(iconId) || iconId < IconId.MIN_VALUE) {
      return err({ type: "ICON_ID_INVALID" });
    }

    return ok(new IconId(iconId));
  }

  /**
   * 永続化済みの値など、制約を満たすことが保証された値から生成する
   * @param iconId アイコンID
   * @returns アイコンID
   * @throws 制約を満たさない場合（呼び出し側の不具合）
   */
  static of(iconId: number): IconId {
    return IconId.create(iconId).match(
      (id) => id,
      (error) => { throw new Error(`アイコンIDが不正です。type:${error.type} iconId:${iconId}`); },
    );
  }
}
