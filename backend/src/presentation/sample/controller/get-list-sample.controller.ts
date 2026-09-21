import { Hono } from "hono";
import { GetListSampleUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { GetListSampleRepository } from "../../../infrastructure";
import type { AppEnv } from "../../../types";
import { GetListSampleResponseDto } from "../dto";

/**
 * サンプル一覧取得
 * @route GET /api/v1/sample
 */
const getListSample = new Hono<AppEnv>().get(API_ENDPOINT.SAMPLE, async (c) => {
  const db = c.get('db');
  const repository = new GetListSampleRepository(db);
  const usecase = new GetListSampleUsecase(repository);

  const entities = await usecase.execute();
  const responseDto = new GetListSampleResponseDto(entities);

  return c.json({ message: "サンプル一覧を取得しました。", data: responseDto.value }, HTTP_STATUS.OK);
});

export { getListSample };
