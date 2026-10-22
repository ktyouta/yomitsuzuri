import { WorkId, type IconId, type WorkMemo, type WorkSort, type WorkTitle } from "../../value-object";

type CreateWorkParamType = {
    title: WorkTitle;
    sort: WorkSort;
    memo: WorkMemo;
    iconId: IconId;
};

type WorkReconstructParamType = {
    id: WorkId;
    title: WorkTitle;
    sort: WorkSort;
    memo: WorkMemo;
    iconId: IconId;
    deleteFlg: boolean;
};

export type WorkSnapshotType = {
    id: string;
    title: string;
    sort: number;
    memo: string | null;
    iconId: number;
    deleteFlg: boolean;
};

export class WorkEntity {

    private constructor(private readonly _id: WorkId,
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
     * 作品作成
     * @param params 作成する作品の情報
     * @returns 新しい ID を採番した、削除されていない作品
     */
    static create(params: CreateWorkParamType) {
        return new WorkEntity(
            WorkId.create(),
            params.title,
            params.sort,
            params.memo,
            params.iconId,
            false
        );
    }

    /**
     * 永続化済みの値から作品を復元する
     * @param params 永続化済みの作品の情報
     * @returns 引数の値をそのまま持つ作品
     */
    static reconstruct(params: WorkReconstructParamType) {
        return new WorkEntity(
            params.id,
            params.title,
            params.sort,
            params.memo,
            params.iconId,
            params.deleteFlg,
        );
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

    /**
     * スナップショットを作成
     * @returns 作品の値
     */
    toSnapshot(): WorkSnapshotType {
        return {
            id: this._id.value,
            title: this._title.value,
            sort: this._sort.value,
            memo: this._memo.value,
            iconId: this._iconId.value,
            deleteFlg: this._deleteFlg,
        };
    }
}