/**
 * 作品タイトル
 */
export class WorkTitle {

    static readonly TITLE_MAX_LENGTH = 100;
    private readonly _value: string;

    /**
     * @param workTitle 作品タイトル
     */
    constructor(workTitle: string) {
        const trimmedTitle = workTitle.trim();

        if (!trimmedTitle) {
            throw new Error(`作品タイトルが設定されていません。`);
        }

        if (trimmedTitle.length > WorkTitle.TITLE_MAX_LENGTH) {
            throw new Error(`作品タイトルは${WorkTitle.TITLE_MAX_LENGTH}文字以内で入力してください。`);
        }

        this._value = trimmedTitle;
    }

    get value() {
        return this._value;
    }
}