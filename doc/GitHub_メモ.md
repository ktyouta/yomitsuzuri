# GitHubリポジトリ作成・プッシュ手順

## 参考サイト

- https://qiita.com/masato5579/items/8a08ea9988f4fd0097e3
- https://it-memo.work/github-first-git-push-command/

## 初回プッシュ手順

### 1. リポジトリの作成

GitHubページ側でリポジトリを作成する

### 2. 作業ディレクトリに移動

### 3. gitリポジトリを作成

```bash
git init
```

### 4. ファイルをインデックスに登録

```bash
git add [ディレクトリ名]
```

### 5. コミット

```bash
git commit -m "コメント"
```

### 6. 現在のブランチをmainに変更

```bash
git branch -M main
```

### 7. リモートリポジトリを登録

「origin ＝ この GitHub リポジトリ」の紐づけを行う

```bash
git remote add origin https://github.com/[GitHubのユーザー名]/[リポジトリ名].git
```

### 8. 修正をリモートリポジトリに反映

```bash
git push origin main
```

## トラブルシューティング

### 8で失敗した場合

以下のコマンド実行後、7, 8を再実行：

```bash
git remote rm origin
```

### `remote: Invalid username or password` が表示された場合

```bash
git config --global user.name ユーザー名
```

実行後に再度プッシュする

---

## ファイル編集後の手順

```bash
git add [ディレクトリ名]
git commit -m "コメント"
git push origin main
```


---

## コミットメッセージの修正

1. 最新のコミットメッセージを修正

   ```bash
   git commit --amend
   ```

2. 強制的にリモートへプッシュ

   ```bash
   git push --force origin <ブランチ名>
   ```

---

## コミット取り消し + 修正してコミット

1. コミットを取り消す

   ```bash
   git reset --soft HEAD~1
   ```

2. ソースを修正

3. 変更をステージング

   ```bash
   git add .
   ```

4. 修正後のコミット

   ```bash
   git commit -m "修正後のコミット"
   ```

5. プッシュ

   ```bash
   git push --force-with-lease
   ```
