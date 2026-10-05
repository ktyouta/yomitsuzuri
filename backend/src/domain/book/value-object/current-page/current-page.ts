/**
 * 現在の読書ページ数
 * 未入力（null / undefined）の場合は null として保持する
 */
export class CurrentPage {

    private readonly _value: number | null;

    /**
     * @param currentPage 現在の読書ページ数
     * @throws currentPage が null / undefined 以外で、0以上の整数でない場合
     */
    constructor(currentPage: number | null | undefined) {
        if (currentPage === null || currentPage === undefined) {
            this._value = null;
            return;
        }

        if (!Number.isInteger(currentPage) || currentPage < 0) {
            throw new Error(`現在の読書ページ数が不正です。`);
        }

        this._value = currentPage;
    }

    get value() {
        return this._value;
    }
}
