import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { z } from "zod";
import { validatorMiddleware } from "./validator.middleware";

const schema = z.object({
  title: z.string(),
  iconId: z.number(),
});

const app = new Hono().post("/", validatorMiddleware("json", schema), (c) => c.json({ data: c.req.valid("json") }, 200));

function post(body: unknown) {
  return app.request("/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("validatorMiddleware", () => {
  it("型・構造が正しい場合、検証済みの値で後続の処理に進むこと", async () => {
    const res = await post({ title: "容疑者Xの献身", iconId: 1 });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { title: "容疑者Xの献身", iconId: 1 } });
  });

  it("型・構造が違反している場合、zod のメッセージを使わず、違反した項目ごとに固定のメッセージを 422 で返すこと", async () => {
    const res = await post({ iconId: "1" });

    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      message: "入力エラー",
      data: [
        { field: "title", message: "入力形式が不正です" },
        { field: "iconId", message: "入力形式が不正です" },
      ],
    });
  });
});
