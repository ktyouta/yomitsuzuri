import { CharacterId, type CharacterAge, type CharacterCharacteristic, type CharacterMemo, type CharacterName, type CharacterOccupation, type GenderId, type WorkId } from "../../value-object";

type CreateCharacterParamType = {
    workId: WorkId;
    name: CharacterName;
    age: CharacterAge;
    genderId: GenderId;
    occupation: CharacterOccupation;
    characteristic: CharacterCharacteristic;
    memo: CharacterMemo;
};

type CharacterReconstructParamType = {
    id: CharacterId;
    workId: WorkId;
    name: CharacterName;
    age: CharacterAge;
    genderId: GenderId;
    occupation: CharacterOccupation;
    characteristic: CharacterCharacteristic;
    memo: CharacterMemo;
    deleteFlg: boolean;
};

type UpdateCharacterParamType = {
    name: CharacterName;
    age: CharacterAge;
    genderId: GenderId;
    occupation: CharacterOccupation;
    characteristic: CharacterCharacteristic;
    memo: CharacterMemo;
}

type CharacterSnapshotType = {
    id: string;
    workId: string;
    name: string;
    age: string | null;
    genderId: number | null;
    occupation: string | null;
    characteristic: string | null;
    memo: string | null;
    deleteFlg: boolean;
}

/**
 * 登場人物（作品に登場する人物）
 */
export class CharacterEntity {

    private constructor(private readonly _id: CharacterId,
        private readonly _workId: WorkId,
        private _name: CharacterName,
        private _age: CharacterAge,
        private _genderId: GenderId,
        private _occupation: CharacterOccupation,
        private _characteristic: CharacterCharacteristic,
        private _memo: CharacterMemo,
        private _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get workId() {
        return this._workId;
    }

    get name() {
        return this._name;
    }

    get age() {
        return this._age;
    }

    get genderId() {
        return this._genderId;
    }

    get occupation() {
        return this._occupation;
    }

    get characteristic() {
        return this._characteristic;
    }

    get memo() {
        return this._memo;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }

    /**
     * 登場人物作成
     * @param params 作成する登場人物の情報
     * @returns 新しい ID を採番した、削除されていない登場人物
     */
    static create(params: CreateCharacterParamType) {
        return new CharacterEntity(
            CharacterId.create(),
            params.workId,
            params.name,
            params.age,
            params.genderId,
            params.occupation,
            params.characteristic,
            params.memo,
            false
        );
    }

    /**
     * 永続化済みの値から登場人物を復元する
     * @param params 永続化済みの登場人物の情報
     * @returns 引数の値をそのまま持つ登場人物
     */
    static reconstruct(params: CharacterReconstructParamType) {
        return new CharacterEntity(
            params.id,
            params.workId,
            params.name,
            params.age,
            params.genderId,
            params.occupation,
            params.characteristic,
            params.memo,
            params.deleteFlg,
        );
    }

    /**
     * 登場人物更新（ID・作品・削除フラグ以外の項目を置き換える）
     *
     * 事前条件（満たさない場合は throw）:
     * - 登場人物が削除されていないこと
     *
     * 事後条件:
     * - 自身の名前・年齢・性別・職業・特徴・メモを引数の内容に置き換える
     * @param params 更新後の登場人物情報
     * @throws 事前条件を満たさない場合
     */
    update(params: UpdateCharacterParamType): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの登場人物です。`);
        }

        this._name = params.name;
        this._age = params.age;
        this._genderId = params.genderId;
        this._occupation = params.occupation;
        this._characteristic = params.characteristic;
        this._memo = params.memo;
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
     * @throws 削除されていない登場人物の場合
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
    toSnapshot(): CharacterSnapshotType {
        return {
            id: this._id.value,
            workId: this._workId.value,
            name: this._name.value,
            age: this._age.value,
            genderId: this._genderId.value,
            occupation: this._occupation.value,
            characteristic: this._characteristic.value,
            memo: this._memo.value,
            deleteFlg: this._deleteFlg,
        };
    }
}
