import type { ZodError } from "zod";
import type { ValidationErrorType } from "../types";

/**
 * Zodエラーをフォーマットする
 * @param errors Zodエラー
 */
export function formatZodErrors(errors: ZodError): ValidationErrorType[] {
  return errors.errors.map((error) => ({
    field: error.path.join("."),
    message: error.message,
  }));
}
