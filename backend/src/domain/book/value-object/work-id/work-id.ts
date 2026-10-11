import { err, ok, type Result } from "neverthrow";
import { ulid } from "ulid";

/**
 * 作品IDの生成失敗
 */
export type WorkIdError = { type: "WORK_ID_INVALID" };

/**
 * 作品ID（ULID）
 */
export class WorkId {

    /**
     * ULID（Crockford's Base32 の26文字。I・L・O・U は含まない）
     */
    private static readonly ULID_PATTERN = /^[0-9A-HJKMNP-TV-Z]{26}$/;
    private readonly _value: string;

    /**
     * @param workId 作品ID
     */
    private constructor(workId: string) {
        this._value = workId;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（作品が存在するかは判定しない）
     * @param workId 作品ID
     * @returns 成功時は作品ID、ULID 形式でない場合はその内容を持つ Result
     */
    static create(workId: string): Result<WorkId, WorkIdError> {
        if (!WorkId.ULID_PATTERN.test(workId)) {
            return err({ type: "WORK_ID_INVALID" });
        }

        return ok(new WorkId(workId));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param workId 作品ID
     * @returns 作品ID
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(workId: string): WorkId {
        return WorkId.create(workId).match(
            (id) => id,
            (error) => { throw new Error(`作品IDが不正です。type:${error.type} workId:${workId}`); },
        );
    }

    /**
     * ULIDで作品IDを生成
     * @returns 新規の作品ID
     */
    static generate(): WorkId {
        return new WorkId(ulid());
    }
}
