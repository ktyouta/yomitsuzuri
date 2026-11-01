import { ulid } from "ulid";

/**
 * 登場人物関係ID（ULID）
 */
export class CharacterRelationId {

    private readonly _value: string;

    /**
     * @param relationId 登場人物関係ID
     * @throws relationId が空の場合
     */
    private constructor(relationId: string) {
        if (!relationId) {
            throw new Error(`登場人物関係IDが設定されていません。`);
        }

        this._value = relationId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで登場人物関係IDを生成
     * @returns 新規の登場人物関係ID
     */
    static create(): CharacterRelationId {
        return new CharacterRelationId(ulid());
    }

    /**
     * 既存の登場人物関係IDからインスタンスを生成（形式は判定しない。存在しない ID は登場人物関係の照合で検出する）
     * @param relationId 登場人物関係ID
     * @returns 登場人物関係ID
     * @throws relationId が空の場合
     */
    static of(relationId: string): CharacterRelationId {
        return new CharacterRelationId(relationId);
    }
}
