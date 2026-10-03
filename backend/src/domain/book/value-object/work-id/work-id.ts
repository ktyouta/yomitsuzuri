import { ulid } from "ulid";

/**
 * 作品ID（ULID）
 */
export class WorkId {

    private readonly _value: string;

    /**
     * @param workId 作品ID
     */
    private constructor(workId: string) {
        if (!workId) {
            throw new Error(`作品IDが設定されていません。`);
        }

        this._value = workId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで作品IDを生成
     * @returns 新規の作品ID
     */
    static generate(): WorkId {
        return new WorkId(ulid());
    }

    /**
     * 既存の作品IDからインスタンスを生成
     * @param workId 作品ID
     * @returns 作品ID
     */
    static of(workId: string): WorkId {
        return new WorkId(workId);
    }
}