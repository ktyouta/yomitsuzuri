import { err, ok, type Result } from "neverthrow";

/**
 * 登場人物名の生成失敗
 */
export type CharacterNameError = { type: "CHARACTER_NAME_EMPTY" }
    | { type: "CHARACTER_NAME_TOO_LONG"; max: number };

/**
 * 登場人物名
 */
export class CharacterName {

    static readonly NAME_MAX_LENGTH = 100;
    private readonly _value: string;

    /**
     * @param characterName 前後の空白を除去済みの登場人物名
     */
    private constructor(characterName: string) {
        this._value = characterName;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param characterName 登場人物名
     * @returns 成功時は登場人物名、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(characterName: string): Result<CharacterName, CharacterNameError> {
        const trimmedName = characterName.trim();

        if (!trimmedName) {
            return err({ type: "CHARACTER_NAME_EMPTY" });
        }

        if (trimmedName.length > CharacterName.NAME_MAX_LENGTH) {
            return err({ type: "CHARACTER_NAME_TOO_LONG", max: CharacterName.NAME_MAX_LENGTH });
        }

        return ok(new CharacterName(trimmedName));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param characterName 登場人物名
     * @returns 登場人物名
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(characterName: string): CharacterName {
        return CharacterName.create(characterName).match(
            (name) => name,
            (error) => { throw new Error(`登場人物名が不正です。type:${error.type}`); },
        );
    }
}
