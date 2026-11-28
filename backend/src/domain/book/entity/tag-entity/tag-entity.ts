import { TagId, type TagName } from "../../value-object";

type CreateTagParamType = {
    name: TagName;
};

type TagReconstructParamType = {
    id: TagId;
    name: TagName;
};

export type TagSnapshotType = {
    id: string;
    name: string;
}

/**
 * タグ（ユーザーが書籍に付けるタグ）
 */
export class TagEntity {

    private constructor(private readonly _id: TagId,
        private _name: TagName,
    ) { }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    /**
     * タグ作成
     * @param params 作成するタグの情報
     * @returns 新しい ID を採番したタグ
     */
    static create(params: CreateTagParamType) {
        return new TagEntity(
            TagId.create(),
            params.name,
        );
    }

    /**
     * 永続化済みの値からタグを復元する
     * @param params 永続化済みのタグの情報
     * @returns 引数の値をそのまま持つタグ
     */
    static reconstruct(params: TagReconstructParamType) {
        return new TagEntity(
            params.id,
            params.name,
        );
    }

    /**
     * スナップショットを作成
     * @returns タグの値
     */
    toSnapshot(): TagSnapshotType {
        return {
            id: this._id.value,
            name: this._name.value,
        };
    }
}
