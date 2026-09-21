# Expected Output — 実装タスク分解

## 入力例

「カテゴリの一覧表示・作成機能を追加したい。カテゴリ名を登録でき、一覧で確認できる」

---

## 期待される出力

```
## 実装タスク分解

### バックエンド（domain → infrastructure → application → presentation の順）

| # | タスク | ファイル | 前提 |
|---|--------|----------|------|
| 1 | categories テーブル定義追加 | `backend/src/infrastructure/db/schema.ts` | ― |
| 2 | マイグレーション生成 | `backend/drizzle/` | #1 |
| 3 | Category Entity 定義 | `backend/src/domain/category/entity/category.entity.ts` | ― |
| 4 | Repository interface 定義 | `backend/src/domain/category/repository/get-categories.repository.interface.ts` `backend/src/domain/category/repository/create-category.repository.interface.ts` | #3 |
| 5 | GetCategoriesRepository 実装 | `backend/src/infrastructure/category/repository/get-categories.repository.ts` | #1, #4 |
| 6 | CreateCategoryRepository 実装 | `backend/src/infrastructure/category/repository/create-category.repository.ts` | #1, #4 |
| 7 | CreateCategorySchema 定義（Zod） | `backend/src/presentation/category/schema/create-category.schema.ts` | ― |
| 8 | DTO 定義（一覧・作成） | `backend/src/presentation/category/dto/get-categories-response.dto.ts` `backend/src/presentation/category/dto/create-category-response.dto.ts` | #3 |
| 9 | GetCategoriesUsecase 実装 | `backend/src/application/category/usecase/get-categories.usecase.ts` | #5 |
| 10 | CreateCategoryUsecase 実装 | `backend/src/application/category/usecase/create-category.usecase.ts` | #6, #7 |
| 11 | GetCategoriesController 実装 | `backend/src/presentation/category/controller/get-categories.controller.ts` | #9, #8 |
| 12 | CreateCategoryController 実装 | `backend/src/presentation/category/controller/create-category.controller.ts` | #10, #7, #8 |
| 13 | CategoryController（ルーター結合） | `backend/src/presentation/category/controller/category.controller.ts` | #11, #12 |
| 14 | index.ts へのルート登録 | `backend/src/index.ts` | #13 |

### フロントエンド

| # | タスク | ファイル | 前提 |
|---|--------|----------|------|
| 15 | paths.ts にパス定義追加 | `frontend/src/config/paths.ts` | ― |
| 16 | rpc 呼び出し関数・Query Key 定義 | `frontend/src/features/category/api/category.ts` `frontend/src/features/category/api/query-key.ts` | バックエンド #14 |
| 17 | useCategories hook（一覧取得） | `frontend/src/features/category/hooks/use-categories.ts` | #16 |
| 18 | useCreateCategory hook（作成） | `frontend/src/features/category/hooks/use-create-category.ts` | #16 |
| 19 | CategoryList コンポーネント（Presentational） | `frontend/src/features/category/components/category-list/category-list.tsx` | ― |
| 20 | CategoryListContainer（hooks と接続） | `frontend/src/features/category/components/category-list/category-list-container.tsx` | #17, #19 |
| 21 | CategoryForm コンポーネント（Presentational） | `frontend/src/features/category/components/category-form/category-form.tsx` | ― |
| 22 | CategoryFormContainer（hooks と接続） | `frontend/src/features/category/components/category-form/category-form-container.tsx` | #18, #21 |
| 23 | CategoryContainer（ページルート） | `frontend/src/features/category/components/category/category-container.tsx` | #20, #22 |
| 24 | router.tsx へのルート登録 | `frontend/src/app/components/router.tsx` | #15, #23 |

---
合計: 24 タスク（バックエンド 14 / フロントエンド 10）
推奨着手順: #1 → #2 → #3 → #4 → #5, #6 → #7 → #8 → #9, #10 → #11, #12 → #13 → #14 → #15, #16 → #17, #18 → #19, #21 → #20, #22 → #23 → #24
```
