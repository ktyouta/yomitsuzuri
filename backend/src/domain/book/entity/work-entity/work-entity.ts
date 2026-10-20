import type { IconId, WorkId, WorkMemo, WorkSort, WorkTitle } from "../../value-object";

export class WorkEntity {

    constructor(private readonly _id: WorkId,
        private readonly _title: WorkTitle,
        private readonly _sort: WorkSort,
        private readonly _memo: WorkMemo,
        private readonly _iconId: IconId,
        private readonly _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get title() {
        return this._title;
    }

    get sort() {
        return this._sort;
    }

    get memo() {
        return this._memo;
    }

    get iconId() {
        return this._iconId;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }

    /**
     * 作品名・メモ・アイコンを置き換えた作品を作成する
     * @param title 更新後の作品名
     * @param memo 更新後のメモ
     * @param iconId 更新後のアイコン
     * @returns 作品名・メモ・アイコン以外は自身と同じ値を持つ作品（自身は変更しない）
     */
    update(title: WorkTitle, memo: WorkMemo, iconId: IconId): WorkEntity {
        return new WorkEntity(
            this._id,
            title,
            this._sort,
            memo,
            iconId,
            this._deleteFlg,
        );
    }
}