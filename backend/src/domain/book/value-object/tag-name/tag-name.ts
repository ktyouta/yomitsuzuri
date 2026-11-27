import { err, ok, type Result } from "neverthrow";

/**
 * タグ名の生成失敗
 */
export type TagNameError = { type: "TAG_NAME_EMPTY" }
    | { type: "TAG_NAME_TOO_LONG"; max: number };

/**
 * タグ名
 */
export class TagName {

    static readonly NAME_MAX_LENGTH = 30;
    private readonly _value: string;

    /**
     * @param tagName 前後の空白を除去済みのタグ名
     */
    private constructor(tagName: string) {
        this._value = tagName;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param tagName タグ名
     * @returns 成功時はタグ名、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(tagName: string): Result<TagName, TagNameError> {
        const trimmedName = tagName.trim();

        if (!trimmedName) {
            return err({ type: "TAG_NAME_EMPTY" });
        }

        if (trimmedName.length > TagName.NAME_MAX_LENGTH) {
            return err({ type: "TAG_NAME_TOO_LONG", max: TagName.NAME_MAX_LENGTH });
        }

        return ok(new TagName(trimmedName));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param tagName タグ名
     * @returns タグ名
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(tagName: string): TagName {
        return TagName.create(tagName).match(
            (name) => name,
            (error) => { throw new Error(`タグ名が不正です。type:${error.type}`); },
        );
    }
}
