import { describe, it, expect, vi, beforeAll } from "vitest";
import { SELF } from "cloudflare:test";

type HealthResponse = {
  message: string;
  data: {
    status: string;
    timestamp: string;
  };
};

type ErrorResponse = {
  message: string;
};

describe("Health Check API", () => {
  it("GET /api/v1/health - 正常にレスポンスを返すこと", async () => {
    const res = await SELF.fetch("http://localhost/api/v1/health");

    expect(res.status).toBe(200);

    const body = (await res.json()) as HealthResponse;
    expect(body.message).toBe("OK");
    expect(body.data).toHaveProperty("status", "healthy");
    expect(body.data).toHaveProperty("timestamp");
  });
});

describe("Not Found Handler", () => {
  it("存在しないエンドポイントで404を返すこと", async () => {
    const res = await SELF.fetch("http://localhost/api/v1/not-exist");

    expect(res.status).toBe(404);

    const body = (await res.json()) as ErrorResponse;
    expect(body.message).toBe("Not Found");
  });
});
