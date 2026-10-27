import { err, ok, type Result } from "neverthrow";

/**
 * 出来事の発生タイミングの生成失敗
 */
export type EventOccurredTimingError = { type: "EVENT_OCCURRED_TIMING_TOO_LONG"; max: number };

/**
 * 出来事の発生タイミング（物語中の時点。「3日目の夜」「第2章」等の自由記述）
 */
export class EventOccurredTiming {

    static readonly OCCURRED_TIMING_MAX_LENGTH = 100;
    private readonly _value: string | null;

    /**
     * @param eventOccurredTiming 前後の空白を除去済みの発生タイミング（未入力は null）
     */
    private constructor(eventOccurredTiming: string | null) {
        this._value = eventOccurredTiming;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param eventOccurredTiming 発生タイミング
     * @returns 成功時は発生タイミング、上限文字数超過の場合はその内容を持つ Result
     */
    static create(eventOccurredTiming: string | null | undefined): Result<EventOccurredTiming, EventOccurredTimingError> {
        const trimmed = eventOccurredTiming?.trim();

        if (!trimmed) {
            return ok(new EventOccurredTiming(null));
        }

        if (trimmed.length > EventOccurredTiming.OCCURRED_TIMING_MAX_LENGTH) {
            return err({ type: "EVENT_OCCURRED_TIMING_TOO_LONG", max: EventOccurredTiming.OCCURRED_TIMING_MAX_LENGTH });
        }

        return ok(new EventOccurredTiming(trimmed));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param eventOccurredTiming 発生タイミング
     * @returns 発生タイミング
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(eventOccurredTiming: string | null | undefined): EventOccurredTiming {
        return EventOccurredTiming.create(eventOccurredTiming).match(
            (value) => value,
            (error) => { throw new Error(`発生タイミングの値が不正です。type:${error.type}`); },
        );
    }
}
