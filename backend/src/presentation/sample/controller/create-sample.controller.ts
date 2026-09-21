import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { CreateSampleUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { CreateSampleRepository } from "../../../infrastructure";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { CreateSampleResponseDto } from "../dto";
import { CreateSampleSchema } from "../schema";

/**
 * サンプル作成
 * @route POST /api/v1/sample
 */
const createSample = new Hono<AppEnv>().post(
  API_ENDPOINT.SAMPLE,
  zValidator("json", CreateSampleSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  }),
  async (c) => {
    const body = c.req.valid("json");
    const db = c.get('db');
    const repository = new CreateSampleRepository(db);
    const usecase = new CreateSampleUsecase(repository);

    const entity = await usecase.execute(body.name, body.description);
    const responseDto = new CreateSampleResponseDto(entity);

    return c.json({ message: "サンプルを作成しました。", data: responseDto.value }, HTTP_STATUS.CREATED);
  }
);

export { createSample };
