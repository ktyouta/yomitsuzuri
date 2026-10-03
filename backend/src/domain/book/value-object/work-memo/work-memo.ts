/**
 * 作品メモ
 * 未入力（null / undefined / 空白のみ）の場合は null として保持する
 */
export class WorkMemo {

    static readonly MEMO_MAX_LENGTH = 2000;
    private readonly _value: string | null;

    /**
     * @param workMemo 作品メモ
     */
    constructor(workMemo: string | null | undefined) {
        const trimmedMemo = workMemo?.trim();

        if (!trimmedMemo) {
            this._value = null;
            return;
        }

        if (trimmedMemo.length > WorkMemo.MEMO_MAX_LENGTH) {
            throw new Error(`作品メモは${WorkMemo.MEMO_MAX_LENGTH}文字以内で入力してください。`);
        }

        this._value = trimmedMemo;
    }

    get value() {
        return this._value;
    }
}