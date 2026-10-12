import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";
import { errorHandler } from "./error-handler.middleware";
import { validatorMiddleware } from "../validator";
import type { AppEnv } from "../../types";

/**
 * 指定した例外を投げるルートを持ち、errorHandler を登録したアプリを作成する
 * @param err ルートで投げる例外
 * @returns GET / で err を投げるアプリ
 */
function createThrowingApp(err: Error) {
  return new Hono<AppEnv>()
    .get("/", () => {
      throw err;
    })
    .onError(errorHandler);
}

describe("errorHandler", () => {
  it("未処理の一般エラー時にユーザー向けの日本語メッセージを返すこと", async () => {
    const res = await createThrowingApp(new Error("some internal failure")).request("/");

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "予期しないエラーが発生しました。" });
  });

  it("400 の HTTPException の場合、例外のメッセージを返さず、ステータスを維持して「入力エラー」を返すこと", async () => {
    const res = await createThrowingApp(new HTTPException(400, { message: "Malformed JSON in request body" })).request("/");

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "入力エラー" });
  });

  it("400 以外の HTTPException の場合、例外のメッセージを返さず、ステータスを維持して汎用のメッセージを返すこと", async () => {
    const res = await createThrowingApp(new HTTPException(500, { message: "Cannot clone request" })).request("/");

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ message: "予期しないエラーが発生しました。" });
  });

  it("JSON として不正なボディを送った場合、Hono の英語のメッセージではなく「入力エラー」を 400 で返すこと", async () => {
    const app = new Hono<AppEnv>()
      .post("/", validatorMiddleware("json", z.object({ title: z.string() })), (c) => c.json({}, 200))
      .onError(errorHandler);

    const res = await app.request("/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    });

    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "入力エラー" });
  });
});
