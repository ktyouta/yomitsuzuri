import { err, ok, Result } from "neverthrow";
import { ulid } from "ulid";

export type CharacterIdError = { type: "CHARACTER_ID_EMPTY" }

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

    /**
     * 外部からの入力値から生成する（形式は判定しない。存在しない ID は登場人物の照合で検出する）
     * @param characterId 登場人物ID
     * @returns 成功時は登場人物ID、空の場合はその内容を持つ Result
     */
    static fromInput(characterId: string): Result<CharacterId, CharacterIdError> {
        if (!characterId) {
            return err({ type: "CHARACTER_ID_EMPTY" });
        }

        return ok(new CharacterId(characterId));
    }
}
