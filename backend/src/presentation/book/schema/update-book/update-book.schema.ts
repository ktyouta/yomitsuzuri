import { z } from "zod";

/**
 * 作品の並び替えリクエストスキーマ（書籍の更新では作品の表示順だけを変更する。作品の追加・削除、作品名・メモ・アイコンの変更は行わない）
 */
const UpdateWorkSchema = z.object({
  id: z.string(),
  sort: z.number(),
});

/**
 * 書籍更新リクエストスキーマ
 *
 * 型・構造のみを検証する。値の制約（文字数・形式等）は値オブジェクト、
 * 作品の指定の誤り（ID重複等）・不変条件（表示順の重複等）は集約（BookAggregate）で判定する。
 * updatedAt は画面の表示時点の書籍の更新日時（排他チェックに使う）。
 */
export const UpdateBookSchema = z.object({
  title: z.string(),
  publishedDate: z.string().nullish(),
  currentPage: z.number().nullish(),
  memo: z.string().nullish(),
  readingStatus: z.number(),
  iconId: z.number(),
  works: z.array(UpdateWorkSchema),
  updatedAt: z.string(),
});
