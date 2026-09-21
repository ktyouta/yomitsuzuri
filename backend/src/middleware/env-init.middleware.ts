import type { Context, Next } from "hono";
import { createEnvConfig } from "../config";
import type { AppEnv } from "../types";

/**
 * 環境変数初期化ミドルウェア
 * リクエストごとに設定オブジェクトを生成し c.var に格納する
 */
export const envInitMiddleware = async (c: Context<AppEnv>, next: Next) => {

    c.set('envConfig', createEnvConfig(c.env));

    await next();
};
