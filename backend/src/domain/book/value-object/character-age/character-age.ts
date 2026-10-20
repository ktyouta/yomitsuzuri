import { err, ok, type Result } from "neverthrow";

/**
 * 登場人物の年齢の生成失敗
 */
export type CharacterAgeError = { type: "CHARACTER_AGE_TOO_LONG"; max: number };

/**
 * 登場人物の年齢
 */
export class CharacterAge {

    static readonly AGE_MAX_LENGTH = 20;
    private readonly _value: string | null;

    /**
     * @param characterAge 前後の空白を除去済みの登場人物の年齢（未入力は null）
     */
    private constructor(characterAge: string | null) {
        this._value = characterAge;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param characterAge 登場人物の年齢
     * @returns 成功時は登場人物の年齢、上限文字数超過の場合はその内容を持つ Result
     */
    static create(characterAge: string | null | undefined): Result<CharacterAge, CharacterAgeError> {
        const trimmed = characterAge?.trim();

        if (!trimmed) {
            return ok(new CharacterAge(null));
        }

        if (trimmed.length > CharacterAge.AGE_MAX_LENGTH) {
            return err({ type: "CHARACTER_AGE_TOO_LONG", max: CharacterAge.AGE_MAX_LENGTH });
        }

        return ok(new CharacterAge(trimmed));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param characterAge 登場人物の年齢
     * @returns 登場人物の年齢
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(characterAge: string | null | undefined): CharacterAge {
        return CharacterAge.create(characterAge).match(
            (value) => value,
            (error) => { throw new Error(`登場人物の年齢が不正です。type:${error.type}`); },
        );
    }
}
