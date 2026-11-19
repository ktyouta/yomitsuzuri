import { AuthorId, type AuthorName } from "../../value-object";

type CreateAuthorParamType = {
    name: AuthorName;
};

type AuthorReconstructParamType = {
    id: AuthorId;
    name: AuthorName;
    deleteFlg: boolean;
};

export type AuthorSnapshotType = {
    id: string;
    name: string;
    deleteFlg: boolean;
}

/**
 * 登場人物（作品に登場する人物）
 */
export class AuthorEntity {

    private constructor(private readonly _id: AuthorId,
        private _name: AuthorName,
        private _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }

    /**
     * 登場人物作成
     * @param params 作成する登場人物の情報
     * @returns 新しい ID を採番した、削除されていない登場人物
     */
    static create(params: CreateAuthorParamType) {
        return new AuthorEntity(
            AuthorId.create(),
            params.name,
            false
        );
    }

    /**
     * 永続化済みの値から登場人物を復元する
     * @param params 永続化済みの登場人物の情報
     * @returns 引数の値をそのまま持つ登場人物
     */
    static reconstruct(params: AuthorReconstructParamType) {
        return new AuthorEntity(
            params.id,
            params.name,
            params.deleteFlg,
        );
    }

    /**
     * 登場人物削除（自身を削除済みにする）
     * @throws 既に削除済みの登場人物の場合
     */
    delete(): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの登場人物です。`);
        }
        this._deleteFlg = true;
    }

    /**
     * 登場人物復元（自身の削除済みを解除する）
     *
     * 事前条件（満たさない場合は throw）:
     * - 登場人物が削除済みであること
     *
     * 事後条件:
     * - 自身の削除済みを解除する（ID・作品・名前等の他の値は変更しない）
     * @throws 事前条件を満たさない場合
     */
    restore(): void {
        if (!this._deleteFlg) {
            throw new Error(`削除されていない登場人物です。`);
        }
        this._deleteFlg = false;
    }

    /**
     * スナップショットを作成
     * @returns 登場人物の値
     */
    toSnapshot(): AuthorSnapshotType {
        return {
            id: this._id.value,
            name: this._name.value,
            deleteFlg: this._deleteFlg,
        };
    }
}
