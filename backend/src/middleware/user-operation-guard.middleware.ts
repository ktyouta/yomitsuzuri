import type { MiddlewareHandler } from "hono";
import { HTTP_STATUS } from "../constant";
import type { AppEnv } from "../types";

/**
 * ユーザー操作ガードミドルウェア
 * 環境変数でユーザー操作機能の有効/無効を制御
 */
export const userOperationGuardMiddleware: MiddlewareHandler<AppEnv> = async (
  c,
  next
) => {
  const config = c.get('envConfig');
  const allowUserOperation = config.allowUserOperation;

  if (!allowUserOperation) {
    return c.json({ message: "この機能は現在の環境では無効化されています。" }, HTTP_STATUS.FORBIDDEN);
  }

  await next();
};
