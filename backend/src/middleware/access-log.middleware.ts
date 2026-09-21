import type { MiddlewareHandler } from "hono";
import type { AppEnv } from "../types";

/**
 * アクセスログを出力するミドルウェア
 */
export const accessLogMiddleware: MiddlewareHandler<AppEnv> = async (
  c,
  next
) => {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header("user-agent") || "-";
  const requestId = c.get("requestId") || "-";

  await next();

  const elapsed = Date.now() - start;
  const status = c.res.status;

  console.log(
    `[${requestId}] ${method} ${path} ${status} ${elapsed}ms | User-Agent: ${userAgent}`
  );
};
