import { z } from "zod";

/**
 * 登場人物関係作成リクエストスキーマ
 *
 * workId はパスパラメータから取得するためボディには含めない。
 * 型・構造のみを検証する。値の制約（文字数等）はドメイン（値オブジェクト）で判定する。
 */
export const CreateCharacterRelationSchema = z.object({
  characterId: z.string(),
  targetCharacterId: z.string(),
  relationName: z.string(),
});
