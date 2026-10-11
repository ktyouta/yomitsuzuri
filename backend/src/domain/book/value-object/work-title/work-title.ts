import { err, ok, type Result } from "neverthrow";
import type { BookTitle } from "../book-title";

/**
 * 作品タイトルの生成失敗
 */
export type WorkTitleError = { type: "WORK_TITLE_EMPTY" }
    | { type: "WORK_TITLE_TOO_LONG"; max: number };

/**
 * 作品タイトル
 */
export class WorkTitle {

    static readonly TITLE_MAX_LENGTH = 100;
    private readonly _value: string;

    /**
     * @param workTitle 前後の空白を除去済みの作品タイトル
     */
    private constructor(workTitle: string) {
        this._value = workTitle;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去する）
     * @param workTitle 作品タイトル
     * @returns 成功時は作品タイトル、空・上限文字数超過の場合はその内容を持つ Result
     */
    static create(workTitle: string): Result<WorkTitle, WorkTitleError> {
        const trimmedTitle = workTitle.trim();

        if (!trimmedTitle) {
            return err({ type: "WORK_TITLE_EMPTY" });
        }

        if (trimmedTitle.length > WorkTitle.TITLE_MAX_LENGTH) {
            return err({ type: "WORK_TITLE_TOO_LONG", max: WorkTitle.TITLE_MAX_LENGTH });
        }

        return ok(new WorkTitle(trimmedTitle));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param workTitle 作品タイトル
     * @returns 作品タイトル
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(workTitle: string): WorkTitle {
        return WorkTitle.create(workTitle).match(
            (title) => title,
            (error) => { throw new Error(`作品タイトルが不正です。type:${error.type}`); },
        );
    }

    /**
     * 書籍登録時に自動作成する作品のタイトルを生成（書籍タイトルを初期値としてコピーする。以降は連動しない）
     * 書籍タイトルの上限文字数が作品タイトルの上限文字数以下であることを前提とする（テストで保証）
     * @param bookTitle 書籍タイトル
     * @returns 書籍タイトルと同じ値の作品タイトル
     * @throws 前提を満たさず、書籍タイトルが作品タイトルの上限文字数を超える場合
     */
    static initial(bookTitle: BookTitle): WorkTitle {
        return WorkTitle.of(bookTitle.value);
    }
}
