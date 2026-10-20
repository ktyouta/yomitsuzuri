import { ulid } from "ulid";

/**
 * 登場人物ID（ULID）
 */
export class CharacterId {

    private readonly _value: string;

    /**
     * @param characterId 登場人物ID
     */
    private constructor(characterId: string) {
        if (!characterId) {
            throw new Error(`登場人物IDが設定されていません。`);
        }

        this._value = characterId;
    }

    get value() {
        return this._value;
    }

    /**
     * ULIDで登場人物IDを生成
     * @returns 新規の登場人物ID
     */
    static create(): CharacterId {
        return new CharacterId(ulid());
    }

    /**
     * 既存の登場人物IDからインスタンスを生成
     * @param characterId 登場人物ID
     * @returns 登場人物ID
     */
    static of(characterId: string): CharacterId {
        return new CharacterId(characterId);
    }
}
