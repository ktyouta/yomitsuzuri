import { err, ok, type Result } from "neverthrow";

/**
 * 登場人物関係の関係名の生成失敗
 */
export type CharacterRelationNameError = { type: "CHARACTER_RELATION_NAME_EMPTY" }
    | { type: "CHARACTER_RELATION_NAME_TOO_LONG"; max: number };

/**
 * 登場人物関係の関係名（「A は B の兄」の「兄」）
 */
export class CharacterRelationName {

    static readonly RELATION_NAME_MAX_LENGTH = 50;
    private readonly _value: string;

    /**
     * @param relationName 前後の空白を除去済みの関係名
     */
    private constructor(relationName: string) {
        this._value = relationName;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param relationName 関係名
     * @returns 成功時は関係名、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(relationName: string): Result<CharacterRelationName, CharacterRelationNameError> {
        const trimmedRelationName = relationName.trim();

        if (!trimmedRelationName) {
            return err({ type: "CHARACTER_RELATION_NAME_EMPTY" });
        }

        if (trimmedRelationName.length > CharacterRelationName.RELATION_NAME_MAX_LENGTH) {
            return err({ type: "CHARACTER_RELATION_NAME_TOO_LONG", max: CharacterRelationName.RELATION_NAME_MAX_LENGTH });
        }

        return ok(new CharacterRelationName(trimmedRelationName));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param relationName 関係名
     * @returns 関係名
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(relationName: string): CharacterRelationName {
        return CharacterRelationName.create(relationName).match(
            (value) => value,
            (error) => { throw new Error(`登場人物関係の関係名が不正です。type:${error.type}`); },
        );
    }
}
