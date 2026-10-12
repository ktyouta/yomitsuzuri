import { Hono } from "hono";
import { setCookie } from "hono/cookie";
import { UpdateUserUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { RefreshToken } from "../../../../domain";
import { UpdateUserRepository } from "../../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { UpdateUserSchema } from "../../schema";

const updateUser = new Hono<AppEnv>().patch(
    API_ENDPOINT.USER,
    userOperationGuardMiddleware,
    authMiddleware,
    validatorMiddleware("json", UpdateUserSchema),
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

        const result = await usecase.execute({ userId: user.userId, name: body.name, birthday: body.birthday });

        if (result.isErr()) {
            const error = result.error;
            switch (error.type) {
                case "INVALID_INPUT":
                    return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
                case "DUPLICATE_NAME":
                    return c.json({ message: "既にユーザーが存在しています。" }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
                case "NOT_FOUND":
                    return c.json({ message: "ユーザーが見つかりません。" }, HTTP_STATUS.NOT_FOUND);
                default: {
                    // 全てのエラー種別を網羅していることを型で保証する
                    error satisfies never;
                    return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
                }
            }
        }

        const { refreshToken, user: updatedUser } = result.value.value;

        setCookie(c, RefreshToken.COOKIE_KEY, refreshToken, RefreshToken.getCookieSetOption(config));

        return c.json({ message: "ユーザー情報の更新が完了しました。", data: { user: updatedUser } }, HTTP_STATUS.OK);
    }
);

export { updateUser };
