/**
 * 書籍内での作品の表示順（1始まり）
 */
export class WorkSort {

    static readonly FIRST = 1;

    private readonly _value: number;

    /**
     * @param sort 表示順
     * @throws sort が FIRST 以上の整数でない場合
     */
    private constructor(sort: number) {
        if (!Number.isInteger(sort) || sort < WorkSort.FIRST) {
            throw new Error(`表示順が不正です。sort:${sort}`);
        }

        this._value = sort;
    }

    get value() {
        return this._value;
    }

    /**
     * 既存の表示順からインスタンスを生成
     * @param sort 表示順
     * @returns 表示順
     * @throws sort が FIRST 以上の整数でない場合
     */
    static of(sort: number): WorkSort {
        return new WorkSort(sort);
    }

    /**
     * 先頭の表示順を生成（書籍登録時に自動作成する作品用）
     * @returns 先頭の表示順
     */
    static first(): WorkSort {
        return new WorkSort(WorkSort.FIRST);
    }
}
