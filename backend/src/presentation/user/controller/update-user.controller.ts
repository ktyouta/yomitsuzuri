import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { UpdateUserUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { RefreshToken } from "../../../domain";
import { UpdateUserRepository } from "../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware } from "../../../middleware";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { UpdateUserResponseDto } from "../dto";
import { UpdateUserSchema } from "../schema";

const updateUser = new Hono<AppEnv>().patch(
    API_ENDPOINT.USER,
    userOperationGuardMiddleware,
    authMiddleware,
    zValidator("json", UpdateUserSchema, (result, c) => {
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
        const repository = new UpdateUserRepository(db);
        const usecase = new UpdateUserUsecase(repository, config);

        const result = await usecase.execute(user.userId.value, body.name, body.birthday);

        if (result.status === "duplicate") {
            return c.json({ message: "既にユーザーが存在しています。" }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
        if (result.status === "not_found") {
            return c.json({ message: "ユーザーが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
        }

        const responseDto = new UpdateUserResponseDto(
            result.entity.userId,
            result.entity.userName,
            result.entity.userBirthday,
            result.darkMode
        );

        setCookie(c, RefreshToken.COOKIE_KEY, result.refreshToken.value, RefreshToken.getCookieSetOption(config));

        return c.json({ message: "ユーザー情報の更新が完了しました。", data: responseDto.value }, HTTP_STATUS.OK);
    }
);

export { updateUser };
