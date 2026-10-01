import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { CreateUserUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { RefreshToken } from "../../../domain";
import { CreateUserRepository } from "../../../infrastructure";
import { userOperationGuardMiddleware } from "../../../middleware";
import type { AppEnv } from "../../../types";
import { formatZodErrors } from "../../../util";
import { CreateUserSchema } from "../schema";

const createUser = new Hono<AppEnv>().post(
    API_ENDPOINT.USER,
    userOperationGuardMiddleware,
    zValidator("json", CreateUserSchema, (result, c) => {
        if (!result.success) {
            return c.json({ message: "バリデーションエラー", data: formatZodErrors(result.error) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }
    }),
    async (c) => {
        const body = c.req.valid("json");
        const db = c.get('db');
        const config = c.get('envConfig');
        const repository = new CreateUserRepository(db);
        const usecase = new CreateUserUsecase(repository, config);

        const result = await usecase.execute(body.name, body.birthday, body.password);
        if (!result) {
            return c.json({ message: "既にユーザーが存在しています。" }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
        }

        const { accessToken, refreshToken, user } = result.value;

        setCookie(c, RefreshToken.COOKIE_KEY, refreshToken, RefreshToken.getCookieSetOption(config));

        return c.json({ message: "ユーザー情報の登録が完了しました。", data: { accessToken, user } }, HTTP_STATUS.CREATED);
    }
);

export { createUser };
