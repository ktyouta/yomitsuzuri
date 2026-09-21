import { drizzle } from "drizzle-orm/d1";
import type { Context, Next } from "hono";
import * as schema from "../infrastructure/db/schema";
import type { AppEnv } from "../types";

/**
 * DBクライアント生成ミドルウェア
 */
export const createDbClientMiddleware = async (c: Context<AppEnv>, next: Next) => {
    c.set('db', drizzle(c.env.DB, { schema }));
    await next();
};
