import type { NotFoundHandler } from "hono";
import { HTTP_STATUS } from "../constant";
import type { AppEnv } from "../types";

/**
 * 404ハンドラー
 */
export const notFoundHandler: NotFoundHandler<AppEnv> = (c) => {

  return c.json(
    {
      message: "Not Found",
    },
    HTTP_STATUS.NOT_FOUND,
  );
};
