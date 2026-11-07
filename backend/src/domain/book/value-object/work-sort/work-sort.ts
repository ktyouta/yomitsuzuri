import { err, ok, type Result } from "neverthrow";

/**
 * 表示順の生成失敗
 */
export type WorkSortError = { type: "WORK_SORT_INVALID"; min: number };

/**
 * 書籍内での作品の表示順（1始まり）
 * 個別に削除した作品は表示順を持たない（null）。書籍ごと削除した作品は、復元で元の順番に戻すため表示順を残す（docs/delete-restore/plan.md の U13）
 */
export class WorkSort {

    static readonly FIRST = 1;
    private readonly _value: number | null;

    /**
     * @param sort 表示順（FIRST 以上の整数、または表示順を持たない場合は null）
     */
    private constructor(sort: number | null) {
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
     * @param sort 表示順（表示順を持たない場合は null）
     * @returns 表示順
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(sort: number | null): WorkSort {
        if (sort === null) {
            return new WorkSort(null);
        }

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

    /**
     * 表示順を持たない状態にした表示順を生成する（作品を個別に削除するとき用）
     * @returns 値が null の表示順（自身は変更しない）
     */
    reset(): WorkSort {
        return new WorkSort(null);
    }
}
