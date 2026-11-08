import { err, ok, type Result } from "neverthrow";

/**
 * 日時の生成失敗
 */
export type TimestampError = { type: "TIMESTAMP_INVALID" };

/**
 * 日時（ISO 8601 形式・UTC・ミリ秒まで。Date.prototype.toISOString() の形式）
 * 排他チェックでは文字列の一致で比べるため、この形式だけを受け付ける
 */
export class Timestamp {

    private static readonly FORMAT = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    private readonly _value: string;

    /**
     * @param value 日時（形式を満たすことは呼び出し側で保証する）
     */
    private constructor(value: string) {
        this._value = value;
    }

    get value() {
        return this._value;
    }

    /**
     * 現在日時を生成する
     * @returns 現在日時
     */
    static create(): Timestamp {
        return new Timestamp(new Date().toISOString());
    }

    /**
     * 外部からの入力値から生成する
     * @param value 日時の文字列
     * @returns 成功時は日時、形式が不正・実在しない日時の場合はその内容を持つ Result
     */
    static fromInput(value: string): Result<Timestamp, TimestampError> {
        if (!Timestamp.FORMAT.test(value)) {
            return err({ type: "TIMESTAMP_INVALID" });
        }

        // 実在しない日時（2月30日など）は Date が補正して別の値にするため、変換後の値が入力と一致するかで判定する
        const date = new Date(value);
        if (Number.isNaN(date.getTime()) || date.toISOString() !== value) {
            return err({ type: "TIMESTAMP_INVALID" });
        }

        return ok(new Timestamp(value));
    }

    /**
     * 永続化済みの値など、形式が保証された値から生成する
     * @param value 日時の文字列
     * @returns 日時
     * @throws 形式が不正・実在しない日時の場合（呼び出し側の不具合）
     */
    static of(value: string): Timestamp {
        return Timestamp.fromInput(value).match(
            (timestamp) => timestamp,
            (error) => { throw new Error(`日時が不正です。type:${error.type} value:${value}`); },
        );
    }

    /**
     * 同じ日時か判定する
     * @param other 比較する日時
     * @returns 同じ日時の場合は true
     */
    equals(other: Timestamp): boolean {
        return this._value === other._value;
    }
}
