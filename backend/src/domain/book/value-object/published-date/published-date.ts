import { err, ok, type Result } from "neverthrow";

/**
 * 出版日の生成失敗
 * - PUBLISHED_DATE_INVALID_FORMAT: YYYY / YYYY-MM / YYYY-MM-DD のいずれの形式でもない
 * - PUBLISHED_DATE_NOT_EXIST: 形式は正しいが実在しない日付（2月30日等）
 */
export type PublishedDateError = { type: "PUBLISHED_DATE_INVALID_FORMAT" }
    | { type: "PUBLISHED_DATE_NOT_EXIST" };

/**
 * 書籍の出版日
 * YYYY / YYYY-MM / YYYY-MM-DD のいずれかの形式を許容する
 * 未入力（null / undefined / 空白のみ）の場合は null として保持する
 */
export class PublishedDate {

    private readonly _value: string | null;

    /**
     * @param publishedDate 検証済みの出版日（未入力は null）
     */
    private constructor(publishedDate: string | null) {
        this._value = publishedDate;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（前後の空白は除去し、空の場合は null として保持する）
     * @param publishedDate 出版日（YYYY / YYYY-MM / YYYY-MM-DD）
     * @returns 成功時は出版日、形式不正・実在しない日付の場合はその内容を持つ Result
     */
    static create(publishedDate: string | null | undefined): Result<PublishedDate, PublishedDateError> {
        const trimmedDate = publishedDate?.trim();

        if (!trimmedDate) {
            return ok(new PublishedDate(null));
        }

        if (!PublishedDate.checkFormat(trimmedDate)) {
            return err({ type: "PUBLISHED_DATE_INVALID_FORMAT" });
        }

        if (!PublishedDate.checkDateValid(trimmedDate)) {
            return err({ type: "PUBLISHED_DATE_NOT_EXIST" });
        }

        return ok(new PublishedDate(trimmedDate));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param publishedDate 出版日
     * @returns 出版日
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(publishedDate: string | null | undefined): PublishedDate {
        return PublishedDate.create(publishedDate).match(
            (date) => date,
            (error) => { throw new Error(`出版日が不正です。type:${error.type}`); },
        );
    }

    /**
     * 許容する形式のいずれかに一致するかを確認する
     * @param publishedDate 出版日
     * @returns 形式が正しい場合 true
     */
    private static checkFormat(publishedDate: string): boolean {
        const regex = /^[0-9]{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$/;
        return regex.test(publishedDate);
    }

    /**
     * 日まで指定されている場合のみ、実在する日付かを確認する（2月30日等を弾く）
     * @param publishedDate 形式チェック済みの出版日
     * @returns 実在する日付、または日の指定がない場合 true
     */
    private static checkDateValid(publishedDate: string): boolean {
        const [yearStr, monthStr, dayStr] = publishedDate.split("-");

        if (!yearStr || !monthStr || !dayStr) {
            return true;
        }

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1;
        const day = parseInt(dayStr, 10);

        const date = new Date(year, month, day);
        return (
            year === date.getFullYear() &&
            month === date.getMonth() &&
            day === date.getDate()
        );
    }
}
