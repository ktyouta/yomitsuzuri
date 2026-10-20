import { err, ok, type Result } from "neverthrow";

/**
 * 登場人物のメモの生成失敗
 */
export type CharacterMemoError = { type: "CHARACTER_MEMO_TOO_LONG"; max: number };

/**
 * 登場人物のメモ
 */
export class CharacterMemo {

    static readonly MEMO_MAX_LENGTH = 2000;
    private readonly _value: string | null;

    /**
     * @param characterMemo 前後の空白を除去済みの登場人物のメモ（未入力は null）
     */
    private constructor(characterMemo: string | null) {
        this._value = characterMemo;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param characterMemo 登場人物のメモ
     * @returns 成功時は登場人物のメモ、上限文字数超過の場合はその内容を持つ Result
     */
    static create(characterMemo: string | null | undefined): Result<CharacterMemo, CharacterMemoError> {
        const trimmed = characterMemo?.trim();

        if (!trimmed) {
            return ok(new CharacterMemo(null));
        }

        if (trimmed.length > CharacterMemo.MEMO_MAX_LENGTH) {
            return err({ type: "CHARACTER_MEMO_TOO_LONG", max: CharacterMemo.MEMO_MAX_LENGTH });
        }

        return ok(new CharacterMemo(trimmed));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param characterMemo 登場人物のメモ
     * @returns 登場人物のメモ
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(characterMemo: string | null | undefined): CharacterMemo {
        return CharacterMemo.create(characterMemo).match(
            (value) => value,
            (error) => { throw new Error(`登場人物のメモが不正です。type:${error.type}`); },
        );
    }
}
