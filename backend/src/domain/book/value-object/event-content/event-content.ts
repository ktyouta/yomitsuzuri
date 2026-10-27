import { err, ok, type Result } from "neverthrow";

/**
 * 出来事の内容の生成失敗
 */
export type EventContentError =
    | { type: "EVENT_CONTENT_EMPTY" }
    | { type: "EVENT_CONTENT_TOO_LONG"; max: number };

/**
 * 出来事の内容
 */
export class EventContent {

    static readonly CONTENT_MAX_LENGTH = 2000;
    private readonly _value: string;

    /**
     * @param eventContent 前後の空白を除去済みの出来事の内容
     */
    private constructor(eventContent: string) {
        this._value = eventContent;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param eventContent 出来事の内容
     * @returns 成功時は出来事の内容、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(eventContent: string): Result<EventContent, EventContentError> {
        const trimmed = eventContent.trim();

        if (!trimmed) {
            return err({ type: "EVENT_CONTENT_EMPTY" });
        }

        if (trimmed.length > EventContent.CONTENT_MAX_LENGTH) {
            return err({ type: "EVENT_CONTENT_TOO_LONG", max: EventContent.CONTENT_MAX_LENGTH });
        }

        return ok(new EventContent(trimmed));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param eventContent 出来事の内容
     * @returns 出来事の内容
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(eventContent: string): EventContent {
        return EventContent.create(eventContent).match(
            (value) => value,
            (error) => { throw new Error(`出来事の内容が不正です。type:${error.type}`); },
        );
    }
}
