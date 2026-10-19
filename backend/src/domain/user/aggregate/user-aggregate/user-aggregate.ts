import { err, ok, type Result } from "neverthrow";
import { UserId } from "../../../shared";
import { LoginCredentialId, LoginId, UserPassword, UserSalt, type NewPassword, type Pepper, type RawPassword, type UserBirthday, type UserName } from "../../value-object";

type GenerateUserParamType = {
    name: UserName;
    birthday: UserBirthday;
    password: NewPassword;
    pepper: Pepper;
};

type UpdateUserParamType = {
    name: UserName;
    birthday: UserBirthday;
};

type UserAggregateReconstructParamType = {
    id: UserId;
    name: UserName;
    birthday: UserBirthday;
    darkMode: boolean;
    loginCredentialId: LoginCredentialId;
    loginId: LoginId;
    password: UserPassword;
    salt: UserSalt;
    deleteFlg: boolean;
};

type UserSnapshotType = {
    id: string;
    name: string;
    birthday: string;
    darkMode: boolean;
    loginCredentialId: string;
    loginId: string;
    passwordHash: string;
    salt: string;
    deleteFlg: boolean;
};

/**
 * パスワード変更の失敗
 * - CURRENT_PASSWORD_MISMATCH: 現在のパスワードが登録済みのパスワードと一致しない
 */
export type ChangePasswordError = { type: "CURRENT_PASSWORD_MISMATCH" };

/**
 * ユーザー集約（プロフィール・ダークモード設定・ログイン情報）
 *
 * ログイン ID は generate・updateUser でユーザー名にそろえる
 */
export class UserAggregate {

    private constructor(private readonly _id: UserId,
        private _name: UserName,
        private _birthday: UserBirthday,
        private _darkMode: boolean,
        private readonly _loginCredentialId: LoginCredentialId,
        private _loginId: LoginId,
        private _password: UserPassword,
        private readonly _salt: UserSalt,
        private _deleteFlg: boolean,
    ) { }

    get id() {
        return this._id;
    }

    get name() {
        return this._name;
    }

    get birthday() {
        return this._birthday;
    }

    get darkMode() {
        return this._darkMode;
    }

    /**
     * 新規登録するユーザー集約を作成する
     * ユーザー ID・ログイン情報 ID・ソルトを採番し、パスワードをハッシュ化して保持する
     * @param params ユーザーの登録内容とペッパー
     * @returns ダークモードが無効・ログイン ID がユーザー名・未削除のユーザー集約
     */
    static async generate(params: GenerateUserParamType): Promise<UserAggregate> {
        const salt = UserSalt.generate();
        const password = await UserPassword.hash(params.password.value, salt, params.pepper);

        return new UserAggregate(
            UserId.generate(),
            params.name,
            params.birthday,
            false,
            LoginCredentialId.generate(),
            LoginId.of(params.name.value),
            password,
            salt,
            false,
        );
    }

    /**
     * 永続化済みの値からユーザー集約を復元する
     * @param params ユーザーとログイン情報の値
     * @returns 渡した値をそのまま保持するユーザー集約
     */
    static reconstruct(params: UserAggregateReconstructParamType): UserAggregate {
        return new UserAggregate(
            params.id,
            params.name,
            params.birthday,
            params.darkMode,
            params.loginCredentialId,
            params.loginId,
            params.password,
            params.salt,
            params.deleteFlg,
        );
    }

    /**
     * ユーザー情報更新
     *
     * 事前条件（満たさない場合は throw）:
     * - ユーザーが削除されていないこと
     *
     * 事後条件:
     * - 自身のユーザー名・生年月日を引数の内容に置き換え、ログイン ID をユーザー名にそろえる
     * @param params 更新後のユーザー名・生年月日
     * @throws 事前条件を満たさない場合
     */
    updateUser(params: UpdateUserParamType): void {
        if (this._deleteFlg) {
            throw new Error(`削除済みのユーザーのためユーザー情報を更新できません。ID:${this._id.value}`);
        }

        this._name = params.name;
        this._birthday = params.birthday;
        this._loginId = LoginId.of(params.name.value);
    }

    /**
     * ダークモード設定更新
     *
     * 事前条件（満たさない場合は throw）:
     * - ユーザーが削除されていないこと
     *
     * 事後条件:
     * - 自身のダークモード設定を引数の内容に置き換える
     * @param darkMode 更新後のダークモード設定
     * @throws 事前条件を満たさない場合
     */
    updateDarkMode(darkMode: boolean): void {
        if (this._deleteFlg) {
            throw new Error(`削除済みのユーザーのためダークモード設定を更新できません。ID:${this._id.value}`);
        }

        this._darkMode = darkMode;
    }

    /**
     * パスワード照合
     *
     * 事前条件（満たさない場合は throw）:
     * - ユーザーが削除されていないこと
     *
     * 事後条件:
     * - 自身は変更しない
     * @param rawPassword 照合用のパスワード（平文）
     * @param pepper ペッパー
     * @returns 登録済みのパスワードと一致する場合は true
     * @throws 事前条件を満たさない場合
     */
    async verifyPassword(rawPassword: RawPassword, pepper: Pepper): Promise<boolean> {
        if (this._deleteFlg) {
            throw new Error(`削除済みのユーザーのためパスワードを照合できません。ID:${this._id.value}`);
        }

        const hashed = await UserPassword.hash(rawPassword.value, this._salt, pepper);
        return hashed.equals(this._password);
    }

    /**
     * パスワード変更
     *
     * 事前条件（満たさない場合は throw）:
     * - ユーザーが削除されていないこと
     *
     * err の条件:
     * - CURRENT_PASSWORD_MISMATCH: 現在のパスワードが登録済みのパスワードと一致しないこと
     *
     * 事後条件:
     * - ok の場合: 自身のパスワードを、登録時と同じソルトでハッシュ化した新しいパスワードに置き換える
     * - err の場合: 自身は変更しない
     * @param nowPassword 現在のパスワード（平文）
     * @param newPassword 新しく設定するパスワード
     * @param pepper ペッパー
     * @returns 成功時は ok、現在のパスワードが一致しない場合はその内容を持つ Result
     * @throws 事前条件を満たさない場合
     */
    async changePassword(nowPassword: RawPassword, newPassword: NewPassword, pepper: Pepper): Promise<Result<void, ChangePasswordError>> {
        if (this._deleteFlg) {
            throw new Error(`削除済みのユーザーのためパスワードを変更できません。ID:${this._id.value}`);
        }

        if (!(await this.verifyPassword(nowPassword, pepper))) {
            return err({ type: "CURRENT_PASSWORD_MISMATCH" });
        }

        this._password = await UserPassword.hash(newPassword.value, this._salt, pepper);
        return ok(undefined);
    }

    /**
     * ユーザー削除（自身を削除済みにする）
     * @throws 既に削除済みのユーザーの場合
     */
    delete(): void {
        if (this._deleteFlg) {
            throw new Error(`既に削除済みのユーザーです。ID:${this._id.value}`);
        }
        this._deleteFlg = true;
    }

    /**
     * スナップショットを作成
     * @returns ユーザーとログイン情報の値
     */
    toSnapshot(): UserSnapshotType {
        return {
            id: this._id.value,
            name: this._name.value,
            birthday: this._birthday.value,
            darkMode: this._darkMode,
            loginCredentialId: this._loginCredentialId.value,
            loginId: this._loginId.value,
            passwordHash: this._password.value,
            salt: this._salt.value,
            deleteFlg: this._deleteFlg,
        };
    }
}
