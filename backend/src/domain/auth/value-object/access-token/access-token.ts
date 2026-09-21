import { sign, verify } from "hono/jwt";
import type { EnvConfig } from "../../../../config";
import { parseDuration } from "../../../../util";
import { UserId } from "../../../user/value-object/user-id";
import { Header } from "../header/header";
import { AccessTokenError } from "./access-token.error";


export class AccessToken {

    // トークン
    private readonly _value: string;
    // 環境設定
    private readonly _config: EnvConfig;
    // ヘッダーのキー
    static readonly HEADER_KEY: string = `Authorization`;
    // 認証スキーム
    static readonly SCHEME: string = `Bearer`;

    private constructor(token: string, config: EnvConfig) {
        this._value = token;
        this._config = config;
    }

    /**
     * トークンを取得
     * @param header
     * @param config
     * @returns
     */
    static get(header: Header, config: EnvConfig) {

        const authHeader = header.get(AccessToken.HEADER_KEY) || ``;
        const [scheme, token] = authHeader.split(` `);

        const accessToken = scheme === AccessToken.SCHEME && token ? token : ``;

        if (!accessToken) {
            throw new AccessTokenError(`Authorizationヘッダの形式が不正です。`);
        }

        return new AccessToken(accessToken, config);
    }

    /**
     * トークンの発行
     * @param userId
     * @param config
     * @returns
     */
    static async create(userId: UserId, config: EnvConfig) {

        const jwtKey = config.accessTokenJwtKey;
        const expires = config.accessTokenExpires;

        if (!jwtKey) {
            throw Error(`設定ファイルにjwt(アクセス)の秘密鍵が設定されていません。`);
        }

        if (!expires) {
            throw Error(`設定ファイルにアクセストークンの有効期限が設定されていません。`);
        }

        const id = userId.value;

        if (!id) {
            throw Error(`アクセストークンの作成にはユーザーIDが必要です。`);
        }

        const now = Math.floor(Date.now() / 1000);
        const expiresSec = parseDuration(expires) / 1000;

        const payload = {
            sub: id,
            iat: now,
            exp: now + expiresSec,
        };

        const token = await sign(payload, jwtKey);

        return new AccessToken(token, config);
    }

    /**
     * トークンチェック
     * @returns
     */
    private async verify() {

        const jwtKey = this._config.accessTokenJwtKey;

        try {

            const decoded = await verify(this.token, jwtKey);

            if (!decoded || typeof decoded !== `object`) {
                throw new AccessTokenError(`アクセストークンが不正です。`);
            }

            return decoded;
        } catch (err) {
            throw new AccessTokenError(`アクセストークンの検証に失敗しました。${err}`);
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

    get token() {
        return this._value;
    }
}
