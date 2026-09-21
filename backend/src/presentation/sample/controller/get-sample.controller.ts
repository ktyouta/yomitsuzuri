import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { GetSampleUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { GetSampleRepository } from "../../../infrastructure";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { GetSampleResponseDto } from "../dto";
import { GetSampleParamSchema } from "../schema";

/**
 * サンプル取得
 * @route GET /api/v1/sample/:id
 */
const getSampleById = new Hono<AppEnv>().get(
  `${API_ENDPOINT.SAMPLE}/:id`,
  zValidator("param", GetSampleParamSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "パラメータが不正です。", data: formatZodErrors(result.error) }, HTTP_STATUS.BAD_REQUEST);
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const db = c.get('db');
    const repository = new GetSampleRepository(db);
    const usecase = new GetSampleUsecase(repository);

    const entity = await usecase.execute(Number(id));

    if (!entity) {
      return c.json({ message: "サンプルが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
    }

    const responseDto = new GetSampleResponseDto(entity);

    return c.json({ message: "サンプルを取得しました。", data: responseDto.value }, HTTP_STATUS.OK);
  }
);

export { getSampleById };
