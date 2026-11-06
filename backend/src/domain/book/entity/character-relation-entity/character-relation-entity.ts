import { err, ok, type Result } from "neverthrow";
import { CharacterRelationId, type CharacterId, type CharacterRelationName, type WorkId } from "../../value-object";

type CreateCharacterRelationParamType = {
    workId: WorkId;
    characterId: CharacterId;
    targetCharacterId: CharacterId;
    relationName: CharacterRelationName;
};

type CharacterRelationReconstructParamType = {
    id: CharacterRelationId;
    workId: WorkId;
    characterId: CharacterId;
    targetCharacterId: CharacterId;
    relationName: CharacterRelationName;
    deleteFlg: boolean;
};

type UpdateCharacterRelationParamType = {
    characterId: CharacterId;
    targetCharacterId: CharacterId;
    relationName: CharacterRelationName;
}

type CharacterRelationSnapshotType = {
    id: string;
    workId: string;
    characterId: string;
    targetCharacterId: string;
    relationName: string;
    deleteFlg: boolean;
}

/**
 * 登場人物関係の生成失敗
 */
export type CharacterRelationError = { type: "CHARACTER_RELATION_SELF" };

/**
 * 登場人物関係（作品の登場人物同士の関係。「人物 は 相手 の 関係名」）
 *
 * 不変条件:
 * - 人物と相手は別の登場人物である
 */
export class CharacterRelationEntity {

    private constructor(private readonly _id: CharacterRelationId,
        private readonly _workId: WorkId,
        private _characterId: CharacterId,
        private _targetCharacterId: CharacterId,
        private _relationName: CharacterRelationName,
        private _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get workId() {
        return this._workId;
    }

    get characterId() {
        return this._characterId;
    }

    get targetCharacterId() {
        return this._targetCharacterId;
    }

    get relationName() {
        return this._relationName;
    }

    get deleteFlg() {
        return this._deleteFlg;
    }

    /**
     * 登場人物関係作成
     * @param params 作成する登場人物関係の情報
     * @returns 成功時は新しい ID を採番した、削除されていない登場人物関係。人物と相手が同じ場合は CHARACTER_RELATION_SELF
     */
    static create(params: CreateCharacterRelationParamType): Result<CharacterRelationEntity, CharacterRelationError> {
        if (CharacterRelationEntity.isSelfRelation(params.characterId, params.targetCharacterId)) {
            return err({ type: "CHARACTER_RELATION_SELF" });
        }

        return ok(new CharacterRelationEntity(
            CharacterRelationId.create(),
            params.workId,
            params.characterId,
            params.targetCharacterId,
            params.relationName,
            false
        ));
    }

    /**
     * 永続化済みの値から登場人物関係を復元する
     * @param params 永続化済みの登場人物関係の情報
     * @returns 引数の値をそのまま持つ登場人物関係
     * @throws 人物と相手が同じ場合（DB の CHECK 制約で除外済みのため、発生すれば不具合）
     */
    static reconstruct(params: CharacterRelationReconstructParamType): CharacterRelationEntity {
        if (CharacterRelationEntity.isSelfRelation(params.characterId, params.targetCharacterId)) {
            throw new Error(`人物と相手が同じ登場人物関係は復元できません。id:${params.id.value}`);
        }

        return new CharacterRelationEntity(
            params.id,
            params.workId,
            params.characterId,
            params.targetCharacterId,
            params.relationName,
            params.deleteFlg,
        );
    }

    /**
     * 人物と相手が同じ登場人物かを判定する
     * @param characterId 人物の ID
     * @param targetCharacterId 相手の ID
     * @returns 同じ場合は true
     */
    private static isSelfRelation(characterId: CharacterId, targetCharacterId: CharacterId): boolean {
        return characterId.value === targetCharacterId.value;
    }

    /**
     * 登場人物関係更新（人物・相手・関係名を置き換える）
     *
     * 事前条件（満たさない場合は throw）:
     * - 登場人物関係が削除されていないこと
     *
     * 事後条件:
     * - 人物と相手が同じ場合は CHARACTER_RELATION_SELF を返し、自身は変更しない
     * - それ以外は、自身の人物・相手・関係名を引数の内容に置き換える（ID・作品・削除フラグは変更しない）
     * @param params 更新後の登場人物関係の情報
     * @returns 成功時は ok。人物と相手が同じ場合は CHARACTER_RELATION_SELF
     * @throws 事前条件を満たさない場合
     */
    update(params: UpdateCharacterRelationParamType): Result<undefined, CharacterRelationError> {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの登場人物関係です。`);
        }

        if (CharacterRelationEntity.isSelfRelation(params.characterId, params.targetCharacterId)) {
            return err({ type: "CHARACTER_RELATION_SELF" });
        }

        this._relationName = params.relationName;
        this._characterId = params.characterId;
        this._targetCharacterId = params.targetCharacterId;
        return ok(undefined);
    }

    /**
     * 登場人物関係削除（自身を削除済みにする）
     *
     * 事前条件（満たさない場合は throw）:
     * - 登場人物関係が削除されていないこと
     *
     * 事後条件:
     * - 自身を削除済みにする（他の項目は変更しない）
     * @throws 事前条件を満たさない場合
     */
    delete(): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みの登場人物関係です。`);
        }
        this._deleteFlg = true;
    }

    /**
     * スナップショットを作成
     * @returns 登場人物関係の値
     */
    toSnapshot(): CharacterRelationSnapshotType {
        return {
            id: this._id.value,
            workId: this._workId.value,
            characterId: this._characterId.value,
            targetCharacterId: this._targetCharacterId.value,
            relationName: this._relationName.value,
            deleteFlg: this._deleteFlg,
        };
    }
}
