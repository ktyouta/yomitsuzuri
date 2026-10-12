import { Hono } from "hono";
import { UpdateUserDarkModeUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { UpdateUserDarkModeRepository } from "../../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { UpdateUserDarkModeSchema } from "../../schema";

const updateUserDarkMode = new Hono<AppEnv>().patch(
    API_ENDPOINT.USER_DARK_MODE,
    userOperationGuardMiddleware,
    authMiddleware,
    validatorMiddleware("json", UpdateUserDarkModeSchema),
    async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
        }
        const body = c.req.valid("json");
        const db = c.get('db');
        const repository = new UpdateUserDarkModeRepository(db);
        const usecase = new UpdateUserDarkModeUsecase(repository);

        const result = await usecase.execute(user.userId, body.darkMode);

        if (!result) {
            return c.json({ message: "ユーザーが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
        }

        return c.json({ message: "ダークモード設定を更新しました。", data: result.value }, HTTP_STATUS.OK);
    }
);

export { updateUserDarkMode };
