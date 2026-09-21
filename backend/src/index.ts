import { Context, Hono } from "hono";
import { cors } from "hono/cors";
import { health } from "./presentation/health";
import { user } from "./presentation/user";
import { sample } from "./presentation/sample";
import { userLogin, userLogout, userPassword, refresh, verify } from "./presentation/auth";
import {
  accessLogMiddleware,
  createDbClientMiddleware,
  envInitMiddleware,
  errorHandler,
  notFoundHandler,
  requestIdMiddleware,
} from "./middleware";
import type { AppEnv } from "./types";

const app = new Hono<AppEnv>();

// ミドルウェア設定
app.use("*", envInitMiddleware);
app.use(
  '*',
  cors({
    origin: (origin, c: Context<AppEnv>) => {
      const config = c.get('envConfig');
      return config.corsOrigin.includes(origin) ? origin : '';
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
    ],
    exposeHeaders: ['Content-Disposition'],
  })
);
app.use("*", requestIdMiddleware);
app.use("*", accessLogMiddleware);
app.use("*", createDbClientMiddleware);

// エラーハンドラー
app.onError(errorHandler);
app.notFound(notFoundHandler);

// ルーティング（チェーンで型情報を保持）
const routes = app
  .route("/", health)
  .route("/", sample)
  .route("/", user)
  .route("/", userLogin)
  .route("/", refresh)
  .route("/", verify)
  .route("/", userLogout)
  .route("/", userPassword);

// RPC用の型エクスポート
export type AppType = typeof routes;

export default app;
