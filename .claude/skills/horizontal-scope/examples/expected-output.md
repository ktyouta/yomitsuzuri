# Expected Output — 水平展開対象ファイル一覧

## 入力例

「カテゴリの一覧表示・作成機能を追加したい」

---

## 期待される出力

```
## 水平展開対象ファイル

### バックエンド（新規作成）
- `backend/src/infrastructure/db/schema.ts` — categoriesTable の定義を追加
- `backend/drizzle/` — マイグレーションファイルを新規生成（`db:generate` で作成）
- `backend/src/domain/category/entity/category.entity.ts` — Entity 定義
- `backend/src/domain/category/entity/index.ts`
- `backend/src/domain/category/repository/get-categories.repository.interface.ts`
- `backend/src/domain/category/repository/create-category.repository.interface.ts`
- `backend/src/domain/category/repository/index.ts`
- `backend/src/domain/category/index.ts`
- `backend/src/infrastructure/category/repository/get-categories.repository.ts`
- `backend/src/infrastructure/category/repository/create-category.repository.ts`
- `backend/src/infrastructure/category/repository/index.ts`
- `backend/src/application/category/usecase/get-categories.usecase.ts`
- `backend/src/application/category/usecase/create-category.usecase.ts`
- `backend/src/application/category/usecase/index.ts`
- `backend/src/application/category/index.ts`
- `backend/src/presentation/category/schema/create-category.schema.ts` — Zod バリデーション
- `backend/src/presentation/category/schema/index.ts`
- `backend/src/presentation/category/dto/get-categories-response.dto.ts`
- `backend/src/presentation/category/dto/create-category-response.dto.ts`
- `backend/src/presentation/category/dto/index.ts`
- `backend/src/presentation/category/controller/get-categories.controller.ts`
- `backend/src/presentation/category/controller/create-category.controller.ts`
- `backend/src/presentation/category/controller/category.controller.ts` — ルーター結合
- `backend/src/presentation/category/controller/index.ts`
- `backend/src/presentation/category/index.ts`

### バックエンド（既存ファイル修正）
- `backend/src/index.ts` — `.route("/", category)` を routes に追加

### フロントエンド（新規作成）
- `frontend/src/features/category/api/category.ts` — rpc 呼び出し関数
- `frontend/src/features/category/api/query-key.ts` — React Query キー定義
- `frontend/src/features/category/hooks/use-categories.ts` — 一覧取得 hook
- `frontend/src/features/category/hooks/use-create-category.ts` — 作成 hook
- `frontend/src/features/category/components/category-list/category-list.tsx` — Presentational
- `frontend/src/features/category/components/category-list/category-list-container.tsx` — Container
- `frontend/src/features/category/components/category-form/category-form.tsx` — Presentational
- `frontend/src/features/category/components/category-form/category-form-container.tsx` — Container
- `frontend/src/features/category/components/category/category.tsx` — ページルートコンポーネント
- `frontend/src/features/category/components/category/category-container.tsx` — Container

### フロントエンド（既存ファイル修正）
- `frontend/src/config/paths.ts` — category ページのパス定義を追加
- `frontend/src/app/components/router.tsx` — ルート登録を追加

---
合計: 34 ファイル（うち新規作成: 32）
```
