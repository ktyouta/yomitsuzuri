-- <親テーブル> を作り直すと、参照している子孫テーブルの行が ON DELETE CASCADE で削除される。
-- D1 のマイグレーションでは PRAGMA foreign_keys=OFF が効かないため、子孫テーブルを退避してから作り直し、作り直した後に戻す。
-- 1. 子孫テーブルを退避する（作り直しの前）
CREATE TABLE `__bak_<子テーブル>` AS SELECT * FROM `<子テーブル>`;--> statement-breakpoint
CREATE TABLE `__bak_<孫テーブル>` AS SELECT * FROM `<孫テーブル>`;--> statement-breakpoint

-- 2. 生成された作り直しの部分（PRAGMA foreign_keys=OFF 〜 CREATE INDEX）をそのまま置く

-- 3. CASCADE が実行されなかった場合も同じ結果になるよう、子孫テーブルを空にしてから退避した行を戻す
--    空にするのは子から順、戻すのは親から順
DELETE FROM `<孫テーブル>`;--> statement-breakpoint
DELETE FROM `<子テーブル>`;--> statement-breakpoint
INSERT INTO `<子テーブル>` SELECT * FROM `__bak_<子テーブル>`;--> statement-breakpoint
INSERT INTO `<孫テーブル>` SELECT * FROM `__bak_<孫テーブル>`;--> statement-breakpoint

-- 4. 退避用テーブルを削除する
DROP TABLE `__bak_<子テーブル>`;--> statement-breakpoint
DROP TABLE `__bak_<孫テーブル>`;
