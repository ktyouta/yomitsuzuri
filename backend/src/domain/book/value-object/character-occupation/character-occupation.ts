import { err, ok, type Result } from "neverthrow";

/**
 * 登場人物の職業の生成失敗
 */
export type CharacterOccupationError = { type: "CHARACTER_OCCUPATION_TOO_LONG"; max: number };

/**
 * 登場人物の職業
 */
export class CharacterOccupation {

    static readonly OCCUPATION_MAX_LENGTH = 50;
    private readonly _value: string | null;

    /**
     * @param characterOccupation 前後の空白を除去済みの登場人物の職業（未入力は null）
     */
    private constructor(characterOccupation: string | null) {
        this._value = characterOccupation;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param characterOccupation 登場人物の職業
     * @returns 成功時は登場人物の職業、上限文字数超過の場合はその内容を持つ Result
     */
    static create(characterOccupation: string | null | undefined): Result<CharacterOccupation, CharacterOccupationError> {
        const trimmed = characterOccupation?.trim();

        if (!trimmed) {
            return ok(new CharacterOccupation(null));
        }

        if (trimmed.length > CharacterOccupation.OCCUPATION_MAX_LENGTH) {
            return err({ type: "CHARACTER_OCCUPATION_TOO_LONG", max: CharacterOccupation.OCCUPATION_MAX_LENGTH });
        }

        return ok(new CharacterOccupation(trimmed));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param characterOccupation 登場人物の職業
     * @returns 登場人物の職業
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(characterOccupation: string | null | undefined): CharacterOccupation {
        return CharacterOccupation.create(characterOccupation).match(
            (value) => value,
            (error) => { throw new Error(`登場人物の職業が不正です。type:${error.type}`); },
        );
    }
}
