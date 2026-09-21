import type { DrizzleD1Database } from "drizzle-orm/d1";
import type * as schema from "./schema";

export type Database = DrizzleD1Database<typeof schema>;

/**
 * トランザクションスコープの型
 * db.transaction(async (tx) => { ... }) の tx に対応
 */
export type TransactionScope = Parameters<Parameters<Database['transaction']>[0]>[0];

/**
 * Database または TransactionScope を受け付ける共通型
 * Repository のコンストラクタで使用する
 */
export type DbClient = Database | TransactionScope;
