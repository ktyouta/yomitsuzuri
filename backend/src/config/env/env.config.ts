/**
 * 環境変数の生値型（Cloudflare Workers Bindings）
 */
export type EnvBindings = {
    // D1データベース
    DB: D1Database;

    // JWT認証キー
    ACCESS_TOKEN_JWT_KEY: string;
    ACCESS_TOKEN_EXPIRES: string;
    REFRESH_TOKEN_JWT_KEY: string;
    REFRESH_TOKEN_EXPIRES: string;

    // パスワード
    PEPPER: string;

    // CORS
    CORS_ORIGIN: string[];

    // 機能制御
    ALLOW_USER_OPERATION: string;
    ENV_PRODUCTION: string;
};

/**
 * パース済み環境変数の型（リクエストスコープで使用）
 */
export type EnvConfig = {
    readonly accessTokenJwtKey: string;
    readonly accessTokenExpires: string;
    readonly refreshTokenJwtKey: string;
    readonly refreshTokenExpires: string;
    readonly pepper: string;
    readonly corsOrigin: string[] | string;
    readonly isProduction: boolean;
    readonly allowUserOperation: boolean;
};

/**
 * 必須環境変数のバリデーション
 */
function requireEnv(value: string | undefined, name: string): string {
    if (!value) {
        throw new Error(`必須環境変数が設定されていません: ${name}`);
    }
    return value;
}

/**
 * CORS_ORIGIN をパースする
 * wrangler vars は実行時に JSON 文字列として渡される場合があるため、
 * 配列・JSON 文字列・カンマ区切り文字列のいずれにも対応する
 */
export function parseCorsOrigin(value: unknown): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [value];
        } catch {
            return [value];
        }
    }
    return [];
}

/**
 * 環境変数からパース済み設定オブジェクトを生成する
 * リクエストごとに呼び出し、c.var に格納して使用する
 */
export function createEnvConfig(env: Partial<EnvBindings>): EnvConfig {
    return {
        accessTokenJwtKey: requireEnv(env.ACCESS_TOKEN_JWT_KEY, 'ACCESS_TOKEN_JWT_KEY'),
        accessTokenExpires: requireEnv(env.ACCESS_TOKEN_EXPIRES, 'ACCESS_TOKEN_EXPIRES'),
        refreshTokenJwtKey: requireEnv(env.REFRESH_TOKEN_JWT_KEY, 'REFRESH_TOKEN_JWT_KEY'),
        refreshTokenExpires: requireEnv(env.REFRESH_TOKEN_EXPIRES, 'REFRESH_TOKEN_EXPIRES'),
        pepper: requireEnv(env.PEPPER, 'PEPPER'),
        corsOrigin: parseCorsOrigin(env.CORS_ORIGIN),
        isProduction: env.ENV_PRODUCTION === 'true',
        allowUserOperation: env.ALLOW_USER_OPERATION === 'true',
    };
}
