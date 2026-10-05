/**
 * 書籍の出版日
 * YYYY / YYYY-MM / YYYY-MM-DD のいずれかの形式を許容する
 * 未入力（null / undefined / 空白のみ）の場合は null として保持する
 */
export class PublishedDate {

    private readonly _value: string | null;

    /**
     * @param publishedDate 出版日（YYYY / YYYY-MM / YYYY-MM-DD）
     */
    constructor(publishedDate: string | null | undefined) {
        const trimmedDate = publishedDate?.trim();

        if (!trimmedDate) {
            this._value = null;
            return;
        }

        if (!this.checkFormat(trimmedDate)) {
            throw new Error(`出版日の形式が不正です（YYYY / YYYY-MM / YYYY-MM-DD）。`);
        }

        if (!this.checkDateValid(trimmedDate)) {
            throw new Error(`出版日が正しくありません。`);
        }

        this._value = trimmedDate;
    }

    get value() {
        return this._value;
    }

    /**
     * 許容する形式のいずれかに一致するかを確認する
     * @param publishedDate 出版日
     * @returns 形式が正しい場合 true
     */
    private checkFormat(publishedDate: string): boolean {
        const regex = /^[0-9]{4}(-(0[1-9]|1[0-2])(-(0[1-9]|[12][0-9]|3[01]))?)?$/;
        return regex.test(publishedDate);
    }

    /**
     * 日まで指定されている場合のみ、実在する日付かを確認する（2月30日等を弾く）
     * @param publishedDate 形式チェック済みの出版日
     * @returns 実在する日付、または日の指定がない場合 true
     */
    private checkDateValid(publishedDate: string): boolean {
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