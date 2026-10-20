import { err, ok, type Result } from "neverthrow";

/**
 * 性別IDの生成失敗
 */
export type GenderIdError = { type: "GENDER_ID_INVALID" };

/**
 * 性別ID（gender_master の主キー）
 */
export class GenderId {

    private readonly _value: number | null;

    /**
     * @param genderId 性別ID（未入力は null）
     */
    private constructor(genderId: number | null) {
        this._value = genderId;
    }

    get value() {
        return this._value;
    }

    /**
     * 外部からの入力値から生成する（未入力の場合は null として保持する。gender_master に存在するかは判定しない）
     * @param genderId 性別ID
     * @returns 成功時は性別ID、1以上の整数でない場合はその内容を持つ Result
     */
    static create(genderId: number | null | undefined): Result<GenderId, GenderIdError> {
        if (genderId === null || genderId === undefined) {
            return ok(new GenderId(null));
        }

        if (!Number.isInteger(genderId) || genderId < 1) {
            return err({ type: "GENDER_ID_INVALID" });
        }

        return ok(new GenderId(genderId));
    }

    /**
     * 永続化済みの値など、制約を満たすことが保証された値から生成する
     * @param genderId 性別ID
     * @returns 性別ID
     * @throws 制約を満たさない場合（呼び出し側の不具合）
     */
    static of(genderId: number | null | undefined): GenderId {
        return GenderId.create(genderId).match(
            (id) => id,
            (error) => { throw new Error(`性別IDが不正です。type:${error.type} genderId:${genderId}`); },
        );
    }
}
