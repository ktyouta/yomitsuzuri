import { WordId, type WordMemo, type WordPage, type WordText, type WorkId } from "../../value-object";

type CreateWordParamType = {
    workId: WorkId;
    text: WordText;
    memo: WordMemo;
    page: WordPage;
};

type WordReconstructParamType = {
    id: WordId;
    workId: WorkId;
    text: WordText;
    memo: WordMemo;
    page: WordPage;
    deleteFlg: boolean;
};

type UpdateWordParamType = {
    text: WordText;
    memo: WordMemo;
    page: WordPage;
}

type WordSnapshotType = {
    id: string;
    workId: string;
    text: string;
    memo: string | null;
    page: number | null;
    deleteFlg: boolean;
}

/**
 * 気になるワード（作品を読みながら気になった言葉・手がかり）
 */
export class WordEntity {

    private constructor(private readonly _id: WordId,
        private readonly _workId: WorkId,
        private _text: WordText,
        private _memo: WordMemo,
        private _page: WordPage,
        private _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get workId() {
        return this._workId;
    }

    get text() {
        return this._text;
    }

    get memo() {
        return this._memo;
    }

    get page() {
        return this._page;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }

    /**
     * 気になるワード作成
     * @param params 作成する気になるワードの情報
     * @returns 新しい ID を採番した、削除されていない気になるワード
     */
    static create(params: CreateWordParamType) {
        return new WordEntity(
            WordId.create(),
            params.workId,
            params.text,
            params.memo,
            params.page,
            false
        );
    }

    /**
     * 永続化済みの値から気になるワードを復元する
     * @param params 永続化済みの気になるワードの情報
     * @returns 引数の値をそのまま持つ気になるワード
     */
    static reconstruct(params: WordReconstructParamType) {
        return new WordEntity(
            params.id,
            params.workId,
            params.text,
            params.memo,
            params.page,
            params.deleteFlg,
        );
    }

    /**
     * 気になるワード更新（ID・作品・削除フラグ以外の項目を置き換える）
     *
     * 事前条件（満たさない場合は throw）:
     * - 気になるワードが削除されていないこと
     *
     * 事後条件:
     * - 自身のワード・メモ・ページを引数の内容に置き換える
     * @param params 更新後の気になるワード情報
     * @throws 事前条件を満たさない場合
     */
    update(params: UpdateWordParamType): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの気になるワードです。`);
        }

        this._text = params.text;
        this._memo = params.memo;
        this._page = params.page;
    }

    /**
     * 気になるワード削除（自身を削除済みにする）
     * @throws 既に削除済みの気になるワードの場合
     */
    delete(): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの気になるワードです。`);
        }
        this._deleteFlg = true;
    }

    /**
     * 気になるワード復元（自身の削除済みを解除する）
     * @throws 削除されていない気になるワードの場合
     */
    restore(): void {
        if (!this._deleteFlg) {
            throw new Error(`削除されていない気になるワードです。`);
        }
        this._deleteFlg = false;
    }

    /**
     * スナップショットを作成
     * @returns 気になるワードの値
     */
    toSnapshot(): WordSnapshotType {
        return {
            id: this._id.value,
            workId: this._workId.value,
            text: this._text.value,
            memo: this._memo.value,
            page: this._page.value,
            deleteFlg: this._deleteFlg,
        };
    }
}
