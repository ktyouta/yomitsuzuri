import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { DeleteSampleUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { DeleteSampleRepository } from "../../../infrastructure";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { DeleteSampleParamSchema } from "../schema";

/**
 * サンプル削除
 * @route DELETE /api/v1/sample/:id
 */
const deleteSample = new Hono<AppEnv>().delete(
  `${API_ENDPOINT.SAMPLE}/:id`,
  zValidator("param", DeleteSampleParamSchema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "パラメータが不正です。", data: formatZodErrors(result.error) }, HTTP_STATUS.BAD_REQUEST);
    }
  }),
  async (c) => {
    const { id } = c.req.valid("param");
    const db = c.get('db');
    const repository = new DeleteSampleRepository(db);
    const usecase = new DeleteSampleUsecase(repository);

    const deleted = await usecase.execute(Number(id));

    if (!deleted) {
      return c.json({ message: "サンプルが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
    }

    return c.json({ message: "サンプルを削除しました。" }, HTTP_STATUS.OK);
  }
);

export { deleteSample };
