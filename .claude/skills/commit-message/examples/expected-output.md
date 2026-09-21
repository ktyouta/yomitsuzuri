# Expected Output — Commit Message

---

## ケース1: 英語コミット履歴のプロジェクト

### 状況
- アイテム一覧画面のフィルターボタンコンポーネントを新規追加した

### 出力

```
## コミットメッセージ候補

### 詳細版
1. Add item filter buttons with active-state styling to list page（アクティブ状態スタイル付きのアイテムフィルターボタンを一覧画面に追加）
   → 変更の主体（filter buttons）・スタイルの特徴・配置場所を具体的に伝えている
2. Implement item filter buttons component with Container/Presentational pattern（Container/Presentationalパターンでアイテムフィルターボタンコンポーネントを実装）
   → 設計パターンを明示することでレビュアーへの伝達力が高い
3. Add item list filter UI with filter-buttons and container components（filter-buttonsとcontainerコンポーネントでアイテム一覧のフィルターUIを追加）
   → ファイル構成の変化を伝えている
4. Create item filtering feature on list screen using presentational components（Presentationalコンポーネントを使って一覧画面にアイテムフィルタリング機能を作成）
   → 「feature」という語で機能単位の追加であることを示している
5. Build item filter section for list page with button group layout（ボタングループレイアウトでアイテム一覧のフィルターセクションを構築）
   → レイアウトの変化（button group）を具体的に伝えている

### 簡易版
1. Add filter buttons to item list page（アイテム一覧画面にフィルターボタンを追加）
   → 変更内容を最短で伝える定番スタイル
2. Implement item filter UI（アイテムフィルターUIを実装）
   → UIの追加であることを明確にしている
3. Add item list filter components（アイテム一覧のフィルターコンポーネントを追加）
   → コンポーネント単位の追加であることを示している
4. Create item filtering feature（アイテムフィルタリング機能を作成）
   → 機能追加であることを1語で表現している
5. Add filtering to item list（アイテム一覧にフィルタリングを追加）
   → 最も簡潔なスタイル
```

---

## ケース2: 日本語コミット履歴のプロジェクト

### 状況
- バックエンドのアイテム取得 API でバグを修正した

### 出力

```
## コミットメッセージ候補

### 詳細版
1. 削除済みアイテムが一覧に表示され続ける問題を修正
   → バグの症状と再現条件を具体的に伝えている
2. get-item-list: 削除フラグの絞り込み条件を修正
   → ファイル名プレフィックスで影響範囲を限定している
3. アイテム一覧 API で deleteFlg のフィルタ漏れによるバグを修正
   → 根本原因（フィルタ漏れ）まで言及している
4. バグ修正: 削除済みアイテムが一覧から消えない問題
   → 「バグ修正」プレフィックスで種別を明示している
5. get-item-list サービス: WHERE 句の条件漏れバグを修正
   → 修正箇所（サービス層）と問題の種類（条件漏れ）を明示している

### 簡易版
1. アイテム一覧の絞り込みバグを修正
   → 変更内容を最短で伝える
2. バグ修正: アイテム一覧 API の削除フィルタ
   → 種別と対象を明確にしている
3. get-item-list の絞り込みロジックを修正
   → 影響ファイルが特定できる
4. 削除済みアイテムの表示問題を修正
   → 現象ベースで伝えている
5. アイテム一覧 API バグ修正
   → 最もシンプルなスタイル
```
