/**
 * 読書状況ID（reading_status_master の主キー）
 */
export class ReadingStatusId {

    /**
     * 新規登録時の読書状況ID（reading_status_master の初期データで id=1 が未読）
     */
    static readonly INITIAL = 1;
    private readonly _value: number;

    /**
     * @param readingStatusId 読書状況ID
     * @throws readingStatusId が1以上の整数でない場合
     */
    private constructor(readingStatusId: number) {
        if (!Number.isInteger(readingStatusId) || readingStatusId < 1) {
            throw new Error(`読書状況IDが不正です。readingStatusId:${readingStatusId}`);
        }

        this._value = readingStatusId;
    }

    get value() {
        return this._value;
    }

    /**
     * 既存の読書状況IDからインスタンスを生成
     * @param readingStatusId 読書状況ID
     * @returns 読書状況ID
     * @throws readingStatusId が1以上の整数でない場合
     */
    static of(readingStatusId: number): ReadingStatusId {
        return new ReadingStatusId(readingStatusId);
    }

    /**
     * 新規登録時の読書状況IDを生成
     * @returns 初期値（未読）の読書状況ID
     */
    static initial(): ReadingStatusId {
        return new ReadingStatusId(ReadingStatusId.INITIAL);
    }
}
