import { AuthorId, AuthorSortOrder, type AuthorName } from "../../value-object";

type CreateAuthorParamType = {
    name: AuthorName;
    sortOrder: AuthorSortOrder;
};

type AuthorReconstructParamType = {
    id: AuthorId;
    name: AuthorName;
    sortOrder: AuthorSortOrder;
    deleteFlg: boolean;
};

export type AuthorSnapshotType = {
    id: string;
    name: string;
    sortOrder: number;
    deleteFlg: boolean;
}

/**
 * 著者（書籍の著者。書籍内での表示順を持つ）
 */
export class AuthorEntity {

    private constructor(private readonly _id: AuthorId,
        private _name: AuthorName,
        private _sortOrder: AuthorSortOrder,
        private _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get sortOrder() {
        return this._sortOrder;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }

    /**
     * 著者作成
     * @param params 作成する著者の情報
     * @returns 新しい ID を採番した、削除されていない著者
     */
    static create(params: CreateAuthorParamType) {
        return new AuthorEntity(
            AuthorId.create(),
            params.name,
            params.sortOrder,
            false
        );
    }

    /**
     * 永続化済みの値から著者を復元する
     * @param params 永続化済みの著者の情報
     * @returns 引数の値をそのまま持つ著者
     */
    static reconstruct(params: AuthorReconstructParamType) {
        return new AuthorEntity(
            params.id,
            params.name,
            params.sortOrder,
            params.deleteFlg,
        );
    }

    /**
     * 著者削除（自身を削除済みにする）
     * @throws 既に削除済みの著者の場合
     */
    delete(): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの著者です。`);
        }
        this._deleteFlg = true;
    }

    /**
     * 著者復元（自身の削除済みを解除する）
     *
     * 事前条件（満たさない場合は throw）:
     * - 著者が削除済みであること
     *
     * 事後条件:
     * - 自身の削除済みを解除する（ID・作品・名前等の他の値は変更しない）
     * @throws 事前条件を満たさない場合
     */
    restore(): void {
        if (!this._deleteFlg) {
            throw new Error(`削除されていない著者です。`);
        }
        this._deleteFlg = false;
    }

    /**
     * スナップショットを作成
     * @returns 著者の値
     */
    toSnapshot(): AuthorSnapshotType {
        return {
            id: this._id.value,
            name: this._name.value,
            sortOrder: this._sortOrder.value,
            deleteFlg: this._deleteFlg,
        };
    }
}
