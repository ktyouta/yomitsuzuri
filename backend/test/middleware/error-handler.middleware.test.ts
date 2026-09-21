import { describe, it, expect } from "vitest";
import type { Context } from "hono";
import { errorHandler } from "../../src/middleware/error-handler.middleware";
import type { AppEnv } from "../../src/types";

function createMockContext(): Context<AppEnv> {
  return {
    get: (_key: string) => "test-request-id",
    json: (body: unknown, status: number) =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
  } as unknown as Context<AppEnv>;
}

describe("errorHandler", () => {
  it("未処理の一般エラー時にユーザー向けの日本語メッセージを返すこと", async () => {
    const c = createMockContext();

    const res = errorHandler(new Error("some internal failure"), c) as Response;
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({ message: "予期しないエラーが発生しました。" });
  });
});
