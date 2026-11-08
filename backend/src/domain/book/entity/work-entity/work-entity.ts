import { err, ok, type Result } from "neverthrow";
import { WorkId, type IconId, type WorkMemo, type WorkSort, type WorkTitle } from "../../value-object";
import type { Timestamp } from "../../../shared";

type CreateWorkParamType = {
    title: WorkTitle;
    sort: WorkSort;
    memo: WorkMemo;
    iconId: IconId;
    updatedAt: Timestamp;
};

type UpdateWorkParamType = {
    title: WorkTitle;
    memo: WorkMemo;
    iconId: IconId;
    /** 画面の表示時点の更新日時（排他チェックに使う） */
    expectedUpdatedAt: Timestamp;
    /** 更新後の更新日時 */
    updatedAt: Timestamp;
};

type WorkReconstructParamType = {
    id: WorkId;
    title: WorkTitle;
    sort: WorkSort;
    memo: WorkMemo;
    iconId: IconId;
    deleteFlg: boolean;
    updatedAt: Timestamp;
};

export type WorkSnapshotType = {
    id: string;
    title: string;
    sort: number | null;
    memo: string | null;
    iconId: number;
    deleteFlg: boolean;
    updatedAt: string;
};

export type WorkUpdateError = { type: "CONFLICT_WORK" };

/**
 * 作品（書籍に収録された物語）
 */
export class WorkEntity {

    private constructor(private readonly _id: WorkId,
        private readonly _title: WorkTitle,
        private readonly _sort: WorkSort,
        private readonly _memo: WorkMemo,
        private readonly _iconId: IconId,
        private readonly _deleteFlg: boolean,
        private readonly _updatedAt: Timestamp,
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

    get updatedAt() {
        return this._updatedAt;
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
            false,
            params.updatedAt,
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
            params.updatedAt,
        );
    }

    /**
     * 作品名・メモ・アイコンを置き換えた作品を作成する
     *
     * err の条件:
     * - CONFLICT_WORK: 画面の表示時点の更新日時（params.expectedUpdatedAt）が、自身の更新日時と一致しないこと
     *
     * 事後条件:
     * - ok の場合: 作品名・メモ・アイコン・更新日時を引数の内容に置き換え、それ以外は自身と同じ値を持つ作品を返す
     * - いずれの場合も自身は変更しない
     * @param params 更新後の作品名・メモ・アイコン・更新日時と、画面の表示時点の更新日時
     * @returns 成功時は更新後の作品、排他の失敗時はその内容を持つ Result
     */
    update(params: UpdateWorkParamType): Result<WorkEntity, WorkUpdateError> {
        if (!this._updatedAt.equals(params.expectedUpdatedAt)) {
            return err({ type: "CONFLICT_WORK" });
        }

        return ok(new WorkEntity(
            this._id,
            params.title,
            this._sort,
            params.memo,
            params.iconId,
            this._deleteFlg,
            params.updatedAt,
        ));
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
            updatedAt: this._updatedAt.value,
        };
    }
}