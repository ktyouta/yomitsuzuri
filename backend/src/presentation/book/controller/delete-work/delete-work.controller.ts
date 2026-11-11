import { Hono } from "hono";
import { DeleteWorkUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { DeleteWorkRepository } from "../../../../infrastructure";
import { authMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { DeleteWorkSchema, WorkIdParamSchema } from "../../schema";

/**
 * 作品削除（論理削除する）
 */
const deleteWork = new Hono<AppEnv>().delete(
  API_ENDPOINT.WORKS_ID,
  authMiddleware,
  validatorMiddleware("param", WorkIdParamSchema),
  validatorMiddleware("json", DeleteWorkSchema),
  async (c) => {
    const user = c.get("user");
    if (!user) {
      return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
    const param = c.req.valid("param");
    const body = c.req.valid("json");
    const db = c.get('db');
    const usecase = new DeleteWorkUsecase(new DeleteWorkRepository(db));

    const result = await usecase.execute({ userId: user.userId, workId: param.workId, body });

    return result.match(
      () => c.json({ message: "作品を削除しました。" }, HTTP_STATUS.OK),
      (error) => {
        switch (error.type) {
          case "INVALID_INPUT":
            return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
          // 他ユーザーの作品の存在を推測させないため、存在しない場合と同じ応答にする
          case "NOT_FOUND":
          case "WORK_NOT_FOUND":
            return c.json({ message: "作品が見つかりませんでした。" }, HTTP_STATUS.NOT_FOUND);
          case "CONFLICT_WORK":
            return c.json({ message: "作品が他の画面で更新されています。最新の情報を読み込み直してください。" }, HTTP_STATUS.CONFLICT);
          case "ALL_WORK_DELETED":
            return c.json({ message: "書籍の最後の作品は削除できません。" }, HTTP_STATUS.CONFLICT);
          default: {
            // 全てのエラー種別を網羅していることを型で保証する
            error satisfies never;
            return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
          }
        }
      },
    );
  }
);

export { deleteWork };
