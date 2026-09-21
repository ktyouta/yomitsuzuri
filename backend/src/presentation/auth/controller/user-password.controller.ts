import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { UpdatePasswordUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { UserPasswordRepository } from "../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware } from "../../../middleware";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { UserPasswordSchema } from "../schema";

const userPassword = new Hono<AppEnv>().patch(
    API_ENDPOINT.USER_PASSWORD,
    userOperationGuardMiddleware,
    authMiddleware,
    zValidator("json", UserPasswordSchema, (result, c) => {
        if (!result.success) {
            return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
    }),
    async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
        }
        const body = c.req.valid("json");
        const db = c.get('db');
        const config = c.get('envConfig');
        const repository = new UserPasswordRepository(db);
        const usecase = new UpdatePasswordUsecase(repository, config);

        const updated = await usecase.execute(user.userId.value, body.nowPassword, body.newPassword);

        if (!updated) {
            return c.json({ message: "パスワードの更新に失敗しました。" }, HTTP_STATUS.UNAUTHORIZED);
        }

        return c.json({ message: "パスワードの更新に成功しました。" }, HTTP_STATUS.OK);
    }
);

export { userPassword };
