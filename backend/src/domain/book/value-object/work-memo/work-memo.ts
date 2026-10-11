import { err, ok, type Result } from "neverthrow";

/**
 * 作品メモの生成失敗
 */
export type WorkMemoError = { type: "WORK_MEMO_TOO_LONG"; max: number };

/**
 * 作品メモ
 */
export class WorkMemo {

    static readonly MEMO_MAX_LENGTH = 2000;
    private readonly _value: string | null;

    /**
     * @param workMemo 前後の空白を除去済みの作品メモ（未入力は null）
     */
    private constructor(workMemo: string | null) {
        this._value = workMemo;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param workMemo 作品メモ
     * @returns 成功時は作品メモ、上限文字数超過の場合はその内容を持つ Result
     */
    static create(workMemo: string | null | undefined): Result<WorkMemo, WorkMemoError> {
        const trimmedMemo = workMemo?.trim();

        if (!trimmedMemo) {
            return ok(new WorkMemo(null));
        }

        if (trimmedMemo.length > WorkMemo.MEMO_MAX_LENGTH) {
            return err({ type: "WORK_MEMO_TOO_LONG", max: WorkMemo.MEMO_MAX_LENGTH });
        }

        return ok(new WorkMemo(trimmedMemo));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param workMemo 作品メモ
     * @returns 作品メモ
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(workMemo: string | null | undefined): WorkMemo {
        return WorkMemo.create(workMemo).match(
            (memo) => memo,
            (error) => { throw new Error(`作品メモが不正です。type:${error.type}`); },
        );
    }
}
