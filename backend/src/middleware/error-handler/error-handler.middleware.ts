import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { HTTP_STATUS } from "../../constant";
import type { AppEnv } from "../../types";

const UNEXPECTED_ERROR_MESSAGE = "予期しないエラーが発生しました。";

/**
 * HTTPException のステータスごとの利用者向けメッセージ
 * Hono が投げる HTTPException のメッセージは英語の開発者向けのため返さない。意味が確定しているステータスだけを載せ、それ以外は汎用のメッセージにする
 */
const HTTP_EXCEPTION_MESSAGE: Partial<Record<ContentfulStatusCode, string>> = {
  [HTTP_STATUS.BAD_REQUEST]: "入力エラー",
};

/**
 * 共通エラーハンドラー
 * @param err 処理中に投げられた例外
 * @param c コンテキスト
 * @returns HTTPException はステータスを維持して利用者向けのメッセージを、それ以外は 500 を返すレスポンス
 */
export const errorHandler: ErrorHandler<AppEnv> = (err, c) => {
  const requestId = c.get("requestId") || "-";
  console.error(`[${requestId}] Error: ${err.message}`, err.stack);

  if (err instanceof HTTPException) {
    return c.json(
      {
        message: HTTP_EXCEPTION_MESSAGE[err.status] ?? UNEXPECTED_ERROR_MESSAGE,
      },
      err.status,
    );
  }

  return c.json(
    {
      message: UNEXPECTED_ERROR_MESSAGE,
    },
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
};
