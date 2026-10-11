import { err, ok, type Result } from "neverthrow";

/**
 * 読書状況IDの生成失敗
 */
export type ReadingStatusIdError = { type: "READING_STATUS_ID_INVALID" };

/**
 * 読書状況ID（reading_status_master の主キー）
 */
export class ReadingStatusId {

    /**
     * 新規登録時の読書状況ID（reading_status_master の初期データで id=1 が未読）
     */
    static readonly INITIAL = 1;
    private readonly _value: number;

    /**
     * @param readingStatusId 読書状況ID
     */
    private constructor(readingStatusId: number) {
        this._value = readingStatusId;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（reading_status_master に存在するかは判定しない）
     * @param readingStatusId 読書状況ID
     * @returns 成功時は読書状況ID、1以上の整数でない場合はその内容を持つ Result
     */
    static create(readingStatusId: number): Result<ReadingStatusId, ReadingStatusIdError> {
        if (!Number.isInteger(readingStatusId) || readingStatusId < 1) {
            return err({ type: "READING_STATUS_ID_INVALID" });
        }

        return ok(new ReadingStatusId(readingStatusId));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param readingStatusId 読書状況ID
     * @returns 読書状況ID
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(readingStatusId: number): ReadingStatusId {
        return ReadingStatusId.create(readingStatusId).match(
            (id) => id,
            (error) => { throw new Error(`読書状況IDが不正です。type:${error.type} readingStatusId:${readingStatusId}`); },
        );
    }

    /**
     * 新規登録時の読書状況IDを生成
     * @returns 初期値（未読）の読書状況ID
     */
    static initial(): ReadingStatusId {
        return ReadingStatusId.of(ReadingStatusId.INITIAL);
    }
}
