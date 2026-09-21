import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { DeleteUserUsecase } from "../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../constant";
import { RefreshToken } from "../../../domain";
import { DeleteUserRepository } from "../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware } from "../../../middleware";
import type { AppEnv } from "../../../types";

const deleteUser = new Hono<AppEnv>().delete(
    API_ENDPOINT.USER,
    userOperationGuardMiddleware,
    authMiddleware,
    async (c) => {
        const user = c.get("user");
        if (!user) {
            return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
        }
        const db = c.get('db');
        const config = c.get('envConfig');
        const repository = new DeleteUserRepository(db);
        const usecase = new DeleteUserUsecase(repository);

        const deleted = await usecase.execute(user.userId.value);

        if (!deleted) {
            return c.json({ message: "ユーザーが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
        }

        setCookie(c, RefreshToken.COOKIE_KEY, "", RefreshToken.getCookieClearOption(config));

        return c.body(null, HTTP_STATUS.NO_CONTENT);
    }
);

export { deleteUser };
