import { err, ok, type Result } from "neverthrow";

/**
 * 登場人物の特徴の生成失敗
 */
export type CharacterCharacteristicError = { type: "CHARACTER_CHARACTERISTIC_TOO_LONG"; max: number };

/**
 * 登場人物の特徴
 */
export class CharacterCharacteristic {

    static readonly CHARACTERISTIC_MAX_LENGTH = 500;
    private readonly _value: string | null;

    /**
     * @param characterCharacteristic 前後の空白を除去済みの登場人物の特徴（未入力は null）
     */
    private constructor(characterCharacteristic: string | null) {
        this._value = characterCharacteristic;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param characterCharacteristic 登場人物の特徴
     * @returns 成功時は登場人物の特徴、上限文字数超過の場合はその内容を持つ Result
     */
    static create(characterCharacteristic: string | null | undefined): Result<CharacterCharacteristic, CharacterCharacteristicError> {
        const trimmed = characterCharacteristic?.trim();

        if (!trimmed) {
            return ok(new CharacterCharacteristic(null));
        }

        if (trimmed.length > CharacterCharacteristic.CHARACTERISTIC_MAX_LENGTH) {
            return err({ type: "CHARACTER_CHARACTERISTIC_TOO_LONG", max: CharacterCharacteristic.CHARACTERISTIC_MAX_LENGTH });
        }

        return ok(new CharacterCharacteristic(trimmed));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param characterCharacteristic 登場人物の特徴
     * @returns 登場人物の特徴
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(characterCharacteristic: string | null | undefined): CharacterCharacteristic {
        return CharacterCharacteristic.create(characterCharacteristic).match(
            (value) => value,
            (error) => { throw new Error(`登場人物の特徴が不正です。type:${error.type}`); },
        );
    }
}
