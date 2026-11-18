import { err, ok, Result } from "neverthrow";
import { ulid } from "ulid";

export type WorkIdError = { type: "WORK_ID_EMPTY" }

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
     * 既存の作品IDからインスタンスを生成（形式は判定しない。存在しない ID は作品の取得・照合で検出する）
     * @param workId 作品ID
     * @returns 作品ID
     * @throws workId が空の場合
     */
    static of(workId: string): WorkId {
        return new WorkId(workId);
    }

    /**
     * 外部からの入力値から生成する（形式は判定しない。存在しない ID は作品の照合で検出する）
     * @param workId 作品ID
     * @returns 成功時は作品ID、空の場合はその内容を持つ Result
     */
    static fromInput(workId: string): Result<WorkId, WorkIdError> {
        if (!workId) {
            return err({ type: "WORK_ID_EMPTY" });
        }

        return ok(new WorkId(workId));
    }
}
