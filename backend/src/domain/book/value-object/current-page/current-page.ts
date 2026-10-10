import { err, ok, type Result } from "neverthrow";

/**
 * 現在の読書ページ数の生成失敗
 */
export type CurrentPageError = { type: "CURRENT_PAGE_INVALID"; min: number };

/**
 * 現在の読書ページ数
 */
export class CurrentPage {

    static readonly MIN_VALUE = 0;
    private readonly _value: number | null;

    /**
     * @param currentPage 現在の読書ページ数（未入力は null）
     */
    private constructor(currentPage: number | null) {
        this._value = currentPage;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（未入力は null として保持する）
     * @param currentPage 現在の読書ページ数
     * @returns 成功時は現在の読書ページ数、MIN_VALUE 以上の整数でない場合はその内容を持つ Result
     */
    static create(currentPage: number | null | undefined): Result<CurrentPage, CurrentPageError> {
        if (currentPage === null || currentPage === undefined) {
            return ok(new CurrentPage(null));
        }

        if (!Number.isInteger(currentPage) || currentPage < CurrentPage.MIN_VALUE) {
            return err({ type: "CURRENT_PAGE_INVALID", min: CurrentPage.MIN_VALUE });
        }

        return ok(new CurrentPage(currentPage));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param currentPage 現在の読書ページ数
     * @returns 現在の読書ページ数
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(currentPage: number | null | undefined): CurrentPage {
        return CurrentPage.create(currentPage).match(
            (page) => page,
            (error) => { throw new Error(`現在の読書ページ数が不正です。type:${error.type}`); },
        );
    }
}
