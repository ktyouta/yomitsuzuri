import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTP_STATUS } from "../constant";
import type { AppEnv } from "../types";

/**
 * 共通エラーハンドラー
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get("requestId") || "-";
  console.error(`[${requestId}] Error: ${err.message}`, err.stack);

  if (err instanceof HTTPException) {
    return c.json(
      {
        message: err.message,
      },
      err.status as ContentfulStatusCode,
    );
  }

  return c.json(
    {
      message: "予期しないエラーが発生しました。",
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
};
