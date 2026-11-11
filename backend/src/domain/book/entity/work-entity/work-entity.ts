import { err, ok, type Result } from "neverthrow";
import type { Timestamp } from "../../../shared";
import { WorkId, type IconId, type WorkMemo, type WorkSort, type WorkTitle } from "../../value-object";

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
        private _sort: WorkSort,
        private readonly _memo: WorkMemo,
        private readonly _iconId: IconId,
        private _deleteFlg: boolean,
        private _updatedAt: Timestamp,
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
     * 作品削除（自身を削除済みにする）
     *
     * 事前条件（満たさない場合は throw）:
     * - 作品が削除されていないこと
     *
     * 事後条件:
     * - 自身を削除済みにし、表示順を持たない状態（null）にする（docs/delete-restore/plan.md の U13）
     * - 更新日時を引数の値に置き換える
     * - ID・作品名・メモ・アイコンは変更しない
     * @param updatedAt 削除後の更新日時
     * @throws 事前条件を満たさない場合
     */
    delete(updatedAt: Timestamp): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの作品です。`);
        }
        this._deleteFlg = true;
        this._sort = this._sort.reset();
        this._updatedAt = updatedAt;
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