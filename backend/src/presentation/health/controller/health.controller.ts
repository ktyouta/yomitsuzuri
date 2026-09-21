import { Hono } from "hono";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import type { AppEnv } from "../../../types";

/**
 * ヘルスチェックエンドポイント
 * @route GET /api/v1/health
 */
const health = new Hono<AppEnv>().get(API_ENDPOINT.HEALTH, (c) => {
  return c.json({
    message: "OK",
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
    },
  }, HTTP_STATUS.OK);
});

export { health };
