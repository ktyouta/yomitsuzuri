import { err, ok, type Result } from "neverthrow";

/**
 * 表示順の生成失敗
 */
export type WorkSortError = { type: "WORK_SORT_INVALID"; min: number };

/**
 * 書籍内での作品の表示順（1始まり）
 */
export class WorkSort {

    static readonly FIRST = 1;
    private readonly _value: number;

    /**
     * @param sort 表示順
     */
    private constructor(sort: number) {
        this._value = sort;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する
     * @param sort 表示順
     * @returns 成功時は表示順、FIRST 以上の整数でない場合はその内容を持つ Result
     */
    static create(sort: number): Result<WorkSort, WorkSortError> {
        if (!Number.isInteger(sort) || sort < WorkSort.FIRST) {
            return err({ type: "WORK_SORT_INVALID", min: WorkSort.FIRST });
        }

        return ok(new WorkSort(sort));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param sort 表示順
     * @returns 表示順
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(sort: number): WorkSort {
        return WorkSort.create(sort).match(
            (workSort) => workSort,
            (error) => { throw new Error(`表示順が不正です。type:${error.type} sort:${sort}`); },
        );
    }

    /**
     * 先頭の表示順を生成（書籍登録時に自動作成する作品用）
     * @returns 先頭の表示順
     */
    static first(): WorkSort {
        return WorkSort.of(WorkSort.FIRST);
    }
}
