import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { UpdateUserDarkModeUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { UpdateUserDarkModeRepository } from "../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware } from "../../../middleware";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { UpdateUserDarkModeResponseDto } from "../dto";
import { UpdateUserDarkModeSchema } from "../schema";

const updateUserDarkMode = new Hono<AppEnv>().patch(
    API_ENDPOINT.USER_DARK_MODE,
    userOperationGuardMiddleware,
    authMiddleware,
    zValidator("json", UpdateUserDarkModeSchema, (result, c) => {
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
        const repository = new UpdateUserDarkModeRepository(db);
        const usecase = new UpdateUserDarkModeUsecase(repository);

        const updated = await usecase.execute(user.userId.value, body.darkMode);

        if (!updated) {
            return c.json({ message: "ユーザーが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
        }

        const responseDto = new UpdateUserDarkModeResponseDto(body.darkMode);

        return c.json({ message: "ダークモード設定を更新しました。", data: responseDto.value }, HTTP_STATUS.OK);
    }
);

export { updateUserDarkMode };
