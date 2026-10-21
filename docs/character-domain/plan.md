# 登場人物（Character）のドメインオブジェクト

## ユーザー決定事項

- 今回は値オブジェクトのみを作る（集約・Usecase・Repository・Controller は対象外）
- 上限文字数: 名前 100 / 年齢 20 / 職業 50 / 特徴 500 / メモ 2000（名前・メモ以外は Claude の提案をユーザーが承認）
- 性別は区分値（マスタ）にする
- 作品内での登場人物名の重複は禁止する（未削除のものが対象）。ドメインサービス（CharacterNameUniquenessDomainService）で判定し、DB にも部分一意インデックス `(work_id, name) WHERE delete_flg = 0` を張る
- 既存の CharacterId の不備（コメント・引数名・例外メッセージが「書籍ID」のまま、テストが BookId を対象にしている）を直す

## 未決定事項

- 集約の境界（design-architect の推奨は book コンテキスト内の独立集約 CharacterAggregate。ユーザー未承認）
- 性別マスタのテーブル設計・マスタ値・`character_transaction.gender` の FK 化（スキーマ変更とマイグレーションが必要）

## タスク

- [ ] CharacterId の修正（コメント・引数名・例外メッセージ、テストを character-id.test.ts に）
- [ ] CharacterName
- [ ] CharacterAge
- [ ] CharacterOccupation
- [ ] CharacterCharacteristic
- [ ] CharacterMemo
- [ ] GenderId（gender_master の主キーを想定。マスタは未作成）

## クラス仕様（契約）

### CharacterId（Value Object）
- **不変条件**: 値は空でない
- **メソッド**:

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| create() | なし | 26文字の ULID を持つ | あり（ulid） |
| of(characterId) | 空でない（Error「登場人物IDが設定されていません。」） | 渡した値を保持する | なし |

- **テストケース**: of で値を保持する / 空文字で throw / create で26文字 / create は毎回異なる値

### CharacterName（Value Object）
- **不変条件**: 前後の空白を除去済みで、空でなく、NAME_MAX_LENGTH（100）文字以下

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| create(name) | なし | 空・空白のみ → err CHARACTER_NAME_EMPTY / 上限超過 → err CHARACTER_NAME_TOO_LONG(max) / それ以外 → 前後の空白を除去した値で ok | なし |
| of(name) | create が ok になる値（Error） | create と同じ値を保持する | なし |

- **テストケース**: 正常値 / 前後の空白除去 / 上限ちょうど / 空・空白のみで EMPTY / 上限+1 で TOO_LONG と max / of の正常系 / of の違反で throw

### CharacterAge・CharacterOccupation・CharacterCharacteristic・CharacterMemo（Value Object・任意項目）
- **不変条件**: 値は null、または前後の空白を除去済みで空でなく上限文字数以下（年齢 20 / 職業 50 / 特徴 500 / メモ 2000）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| create(value) | なし | null・undefined・空・空白のみ → null で ok / 上限超過 → err CHARACTER_{項目}_TOO_LONG(max) / それ以外 → 前後の空白を除去した値で ok | なし |
| of(value) | create が ok になる値（Error） | create と同じ値を保持する | なし |

- **テストケース**: 正常値 / 前後の空白除去 / 上限ちょうど / null・undefined・空・空白のみで null / 上限+1 で TOO_LONG と max / of の正常系 / of の違反で throw

### GenderId（Value Object）
- **不変条件**: 値は null、または1以上の整数（gender_master に存在するかは判定しない）

| メソッド | 事前条件（違反時の例外） | 事後条件 | 決定的でない処理 |
|---|---|---|---|
| create(genderId) | なし | null・undefined → null で ok / 1以上の整数でない → err GENDER_ID_INVALID / それ以外 → 値を保持して ok | なし |
| of(genderId) | create が ok になる値（Error） | 値を保持する | なし |

- **テストケース**: 正常値 / null・undefined で null / 0・負数・小数で INVALID / of の正常系（null を含む） / of の違反で throw
