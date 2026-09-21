import type { MiddlewareHandler } from "hono";
import { GetAuthenticatedUserUsecase } from "../application";
import { HTTP_STATUS } from "../constant";
import { AccessToken, Header } from "../domain";
import { GetUserProfileRepository } from "../infrastructure";
import type { AppEnv } from "../types";


/**
 * 認証ミドルウェア
 */
export const authMiddleware: MiddlewareHandler<AppEnv> = async (c, next) => {

    try {

        const config = c.get('envConfig');
        const header = new Header(c.req.raw);
        const accessToken = AccessToken.get(header, config);

        const userId = await accessToken.getPayload();

        const db = c.get('db');
        const repository = new GetUserProfileRepository(db);
        const usecase = new GetAuthenticatedUserUsecase(repository);

        const userInfo = await usecase.execute(userId);

        if (!userInfo) {
            return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
        }

        c.set("user", {
            userId,
            info: {
                id: userInfo.id,
                name: userInfo.name,
                birthday: userInfo.birthday,
            },
        });

        await next();
    } catch (err) {
        console.error("Auth error:", err);
        return c.json({ message: "認証エラー" }, HTTP_STATUS.UNAUTHORIZED);
    }
};
