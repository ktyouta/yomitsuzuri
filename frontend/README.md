# React Vite Template

React + TypeScript + Vite を使用したフロントエンド開発用テンプレートです。

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | React 19 |
| ビルドツール | Vite |
| 言語 | TypeScript |
| スタイリング | Tailwind CSS |
| 状態管理 | React Query (TanStack Query) |
| ルーティング | React Router v7 |
| フォーム | React Hook Form + Zod |
| API通信 | Axios |
| テスト | Vitest + Testing Library |
| コンポーネントカタログ | Storybook |
| Linting | ESLint |

## セットアップ

### 前提条件

- Node.js 18以上
- npm 9以上

### インストール

```bash
# 依存関係のインストール
npm install

# 環境変数ファイルの作成
cp .env.example .env.development
```

### 環境変数

`.env.development` に以下の環境変数を設定してください：

| 変数名 | 説明 |
|--------|------|
| VITE_APP_API_URL | APIサーバーのベースURL |

## 開発

```bash
# 開発サーバー起動
npm run dev

# Storybook起動
npm run storybook

# テスト実行
npm run test

# Lintチェック
npm run lint

# ビルド
npm run build
```

## フォルダ構成

```
src/
├── app/                    # アプリケーションエントリポイント
│   ├── components/         # App, Router, ProtectedRoute等
├── components/             # 共通コンポーネント
│   ├── ui/                 # UIプリミティブ (Button, Textbox等)
│   └── pages/              # ページレベルコンポーネント (NotFound, Loading等)
├── config/                 # 設定 (paths, env)
├── features/               # 機能別モジュール
│   └── [feature]/
│       ├── api/            # API呼び出し
│       ├── components/     # 機能固有コンポーネント
│       ├── hooks/          # 機能固有フック
│       └── types/          # 機能固有型定義
├── hooks/                  # 共通カスタムフック
├── lib/                    # 外部ライブラリラッパー
├── testing/                # テスト設定・ユーティリティ
├── types/                  # 共通型定義
└── utils/                  # ユーティリティ関数
```

## コーディング規約

- TypeScriptの厳密モード（strict: true）を使用
- コンポーネントはfunction宣言で定義
- スタイルはTailwind CSSのみ使用
- テストはVitestで記述
- パスエイリアス `@/` を使用（例: `import { Button } from '@/components'`）

## 新機能の追加手順

1. `src/features/` 配下に機能フォルダを作成
2. components, hooks, api, types を必要に応じて作成
3. ルーティングを `src/app/components/router.tsx` に追加
4. テストとStorybookを作成
