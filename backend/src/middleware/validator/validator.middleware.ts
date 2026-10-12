import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import type { ZodSchema } from "zod";
import { HTTP_STATUS } from "../../constant";

/**
 * リクエストの型・構造を検証するミドルウェア
 * 違反時は zod のメッセージを使わず、値の制約違反と同じ形（項目名と固定のメッセージ）で返す
 * @param target 検証対象（json・query・param 等）
 * @param schema 型・構造を定義した zod スキーマ
 * @returns 違反時は 422 を返し、通過時は検証済みの値を c.req.valid で取得できるようにして後続の処理に進むミドルウェア
 */
export function validatorMiddleware<T extends ZodSchema, Target extends keyof ValidationTargets>(target: Target, schema: T) {
  return zValidator(target, schema, (result, c) => {
    if (!result.success) {
      return c.json({ message: "入力エラー", data: result.error.errors.map((e) => ({ field: e.path.join("."), message: "入力形式が不正です" })) }, HTTP_STATUS.UNPROCESSABLE_ENTITY);
    }
  });
}
