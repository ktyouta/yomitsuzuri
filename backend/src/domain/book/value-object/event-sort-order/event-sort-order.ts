import { err, ok, type Result } from "neverthrow";

/**
 * 出来事の時系列順の生成失敗
 */
export type EventSortOrderError = { type: "EVENT_SORT_ORDER_INVALID"; min: number };

/**
 * 作品内での出来事の時系列順（1始まり）
 */
export class EventSortOrder {

    static readonly FIRST = 1;
    private readonly _value: number;

    /**
     * @param sortOrder 時系列順
     */
    private constructor(sortOrder: number) {
        this._value = sortOrder;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する
     * @param sortOrder 時系列順
     * @returns 成功時は時系列順、FIRST 以上の整数でない場合はその内容を持つ Result
     */
    static create(sortOrder: number): Result<EventSortOrder, EventSortOrderError> {
        if (!Number.isInteger(sortOrder) || sortOrder < EventSortOrder.FIRST) {
            return err({ type: "EVENT_SORT_ORDER_INVALID", min: EventSortOrder.FIRST });
        }

        return ok(new EventSortOrder(sortOrder));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param sortOrder 時系列順
     * @returns 時系列順
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(sortOrder: number): EventSortOrder {
        return EventSortOrder.create(sortOrder).match(
            (eventSortOrder) => eventSortOrder,
            (error) => { throw new Error(`出来事の時系列順が不正です。type:${error.type} sortOrder:${sortOrder}`); },
        );
    }
}
