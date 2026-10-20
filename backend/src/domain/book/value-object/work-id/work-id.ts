import { ulid } from "ulid";

/**
 * 作品ID（ULID）
 */
export class WorkId {

    private readonly _value: string;

    /**
     * @param workId 作品ID
     * @throws workId が空の場合
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
    static create(): WorkId {
        return new WorkId(ulid());
    }

    /**
     * 既存の作品IDからインスタンスを生成（形式は判定しない。存在しない ID は作品の照合で検出する）
     * @param workId 作品ID
     * @returns 作品ID
     * @throws workId が空の場合
     */
    static of(workId: string): WorkId {
        return new WorkId(workId);
    }
}
