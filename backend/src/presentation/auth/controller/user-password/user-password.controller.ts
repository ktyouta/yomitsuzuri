import { Hono } from "hono";
import { UpdatePasswordUsecase } from "../../../../application";
import { API_ENDPOINT, HTTP_STATUS } from "../../../../constant";
import { UserPasswordRepository } from "../../../../infrastructure";
import { authMiddleware, userOperationGuardMiddleware, validatorMiddleware } from "../../../../middleware";
import type { AppEnv } from "../../../../types";
import { toInputErrorMessage } from "../../error-message";
import { UserPasswordSchema } from "../../schema";

const userPassword = new Hono<AppEnv>().patch(
    API_ENDPOINT.USER_PASSWORD,
    userOperationGuardMiddleware,
    authMiddleware,
    validatorMiddleware("json", UserPasswordSchema),
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

        const result = await usecase.execute(user.userId, body);
        if (result.isErr()) {
            const error = result.error;
            switch (error.type) {
                case "INVALID_INPUT":
                    return c.json({ message: "入力エラー", data: error.errors.map((e) => ({ field: e.field, message: toInputErrorMessage(e.error) })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
                case "CURRENT_PASSWORD_MISMATCH":
                case "NOT_FOUND":
                    return c.json({ message: "パスワードの更新に失敗しました。" }, HTTP_STATUS.UNAUTHORIZED);
                default: {
                    // 全てのエラー種別を網羅していることを型で保証する
                    error satisfies never;
                    return c.json({ message: "サーバーエラー" }, HTTP_STATUS.INTERNAL_SERVER_ERROR);
                }
            }
        }

        return c.json({ message: "パスワードの更新に成功しました。" }, HTTP_STATUS.OK);
    }
);

export { userPassword };
