import { ulid } from "ulid";

/**
 * 出来事ID（ULID）
 */
export class EventId {

    private readonly _value: string;

    /**
     * @param eventId 出来事ID
     * @throws eventId が空の場合
     */
    private constructor(eventId: string) {
        if (!eventId) {
            throw new Error(`出来事IDが設定されていません。`);
        }

        this._value = eventId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで出来事IDを生成
     * @returns 新規の出来事ID
     */
    static create(): EventId {
        return new EventId(ulid());
    }

    /**
     * 既存の出来事IDからインスタンスを生成（形式は判定しない。存在しない ID は出来事の照合で検出する）
     * @param eventId 出来事ID
     * @returns 出来事ID
     * @throws eventId が空の場合
     */
    static of(eventId: string): EventId {
        return new EventId(eventId);
    }
}
