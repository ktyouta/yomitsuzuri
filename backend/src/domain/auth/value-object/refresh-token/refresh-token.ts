import { sign, verify } from "hono/jwt";
import type { EnvConfig } from "../../../../config";
import { parseDuration } from "../../../../util";
import { Cookie } from "../cookie";
import { UserId } from "../../../user/value-object/user-id";


export class RefreshToken {

    // トークン
    private readonly _value: string;
    // 環境設定
    private readonly _config: EnvConfig;
    // cookieのキー
    static readonly COOKIE_KEY: string = `refresh_token`;

    private constructor(token: string, config: EnvConfig) {
        this._value = token;
        this._config = config;
    }

    /**
     * cookieオプション(生成)を取得
     * @param config
     * @returns
     */
    static getCookieSetOption(config: EnvConfig) {

        const isProduction = config.isProduction;
        const expires = config.refreshTokenExpires;

        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: `lax` as const,
            maxAge: parseDuration(expires) / 1000,
            path: `/`,
        };
    }

    /**
     * cookieオプション(失効)を取得
     * @param config
     * @returns
     */
    static getCookieClearOption(config: EnvConfig) {

        const isProduction = config.isProduction;

        return {
            httpOnly: true,
            secure: isProduction,
            sameSite: `lax` as const,
            path: `/`,
            maxAge: 0,
        };
    }

    /**
     * トークンを取得
     * @param cookie
     * @param config
     * @returns
     */
    static get(cookie: Cookie, config: EnvConfig) {

        const token = cookie.get(RefreshToken.COOKIE_KEY);

        if (!token) {
            throw Error(`トークンが存在しません。`);
        }

        return new RefreshToken(token, config);
    }

    /**
     * トークンの発行
     * @param userId
     * @param config
     * @returns
     */
    static async create(userId: UserId, config: EnvConfig) {

        const jwtKey = config.refreshTokenJwtKey;
        const expires = config.refreshTokenExpires;

        if (!jwtKey) {
            throw Error(`設定ファイルにjwt(リフレッシュ)の秘密鍵が設定されていません。`);
        }

        if (!expires) {
            throw Error(`設定ファイルにリフレッシュトークンの有効期限が設定されていません。`);
        }

        const id = userId.value;

        if (!id) {
            throw Error(`リフレッシュトークンの作成にはユーザーIDが必要です。`);
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresSec = parseDuration(expires) / 1000;

        const payload = {
            sub: id,
            iat: now,
            exp: now + expiresSec,
            sessionStartedAt: now,
        };

        const token = await sign(payload, jwtKey);

        return new RefreshToken(token, config);
    }

    /**
     * トークン再発行
     */
    async refresh() {

        const jwtKey = this._config.refreshTokenJwtKey;
        const expires = this._config.refreshTokenExpires;
        const decoded = await this.verify();

        const now = Math.floor(Date.now() / 1000);
        const expiresSec = parseDuration(expires) / 1000;

        if (!decoded.sub || !decoded.iat) {
            throw Error(`Claimの設定が不足しています。`);
        }

        const payload = {
            sub: decoded.sub,
            iat: decoded.iat,
            exp: now + expiresSec,
            sessionStartedAt: now,
        };

        const token = await sign(payload, jwtKey);

        return new RefreshToken(token, this._config);
    }

    /**
     * トークンチェック
     * @returns
     */
    private async verify() {

        const jwtKey = this._config.refreshTokenJwtKey;

        try {

            const decoded = await verify(this.value, jwtKey);

            if (!decoded || typeof decoded !== `object`) {
                throw Error(`リフレッシュトークンが不正です。`);
            }

            return decoded;
        } catch (err) {
            throw Error(`リフレッシュトークンの検証に失敗しました。${err}`);
        }
    }

    /**
     * トークンのペイロードを取得
     * @returns
     */
    async getPayload() {

        const decode = await this.verify();

        if (!decode.sub || typeof decode.sub !== 'string') {
            throw new Error(`subが設定されていません。`);
        }

        return UserId.of(decode.sub);
    }

    /**
     * 絶対期限チェック
     */
    async isAbsoluteExpired() {

        const expires = this._config.refreshTokenExpires;
        const decode = await this.verify();

        if (typeof decode.iat !== 'number') {
            throw new Error(`iatが設定されていません。`);
        }

        const nowMs = Date.now();
        const iatMs = decode.iat * 1000;

        return nowMs - iatMs > parseDuration(expires);
    }

    get value() {
        return this._value;
    }
}
