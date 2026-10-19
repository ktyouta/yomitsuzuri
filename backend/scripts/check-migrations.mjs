/**
 * 未適用のマイグレーションを、適用先と同じ状態の使い捨て D1 に当てて検証する
 *
 * 使い方: node scripts/check-migrations.mjs <local|prod> [--dir <マイグレーションのフォルダ>] [--applied-until <番号>]
 * - local / prod: 適用先。未適用のマイグレーションを、適用先の適用済み一覧から求める（prod は読み取りのみ）
 * - --dir: 検証するマイグレーションのフォルダ（既定は drizzle）
 * - --applied-until: 適用先を問い合わせず、指定した番号までを適用済みとみなす（スクリプト自体の検証用）
 *
 * 次のいずれかに当たる場合は終了コード 1 で終了し、適用を止める
 * - 子孫テーブルを持つテーブルを DROP するのに、子孫テーブルの退避・戻しがそろっていない
 * - 適用後に、いずれかのテーブルの件数が減った
 * - 適用後に、外部キーの違反がある
 */
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

const BACKEND_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATABASE_NAME = "yomitsuzuri-db";
const CHECK_DATABASE_NAME = "migration-check-db";
const MIGRATION_FILE = /^\d{4}_[A-Za-z0-9_-]+\.sql$/;

/**
 * コマンドライン引数を解釈する
 * @param {string[]} argv
 * @returns {{ target: string, dir: string, appliedUntil: string | undefined }}
 */
function parseArgs(argv) {
  const [target, ...rest] = argv;
  if (target !== "local" && target !== "prod") {
    throw new Error("適用先に local か prod を指定してください。");
  }
  const option = (name) => {
    const index = rest.indexOf(name);
    return index >= 0 ? rest[index + 1] : undefined;
  };
  return {
    target,
    dir: resolve(BACKEND_DIR, option("--dir") ?? "drizzle"),
    appliedUntil: option("--applied-until"),
  };
}

/**
 * wrangler を実行する
 * @param {string[]} args
 * @returns {{ ok: boolean, out: string }}
 */
function wrangler(args) {
  const quoted = args.map((arg) => (/[\s"]/.test(arg) ? `"${arg}"` : arg));
  const result = spawnSync(`npx wrangler ${quoted.join(" ")}`, { cwd: BACKEND_DIR, shell: true, encoding: "utf8", input: "" });
  return { ok: result.status === 0, out: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

/**
 * 適用先で未適用のマイグレーションを取得する（読み取りのみ）
 * @param {string} target
 * @returns {string[]}
 */
function listPendingMigrations(target) {
  const location = target === "prod" ? ["--env", "production", "--remote"] : ["--local"];
  const result = wrangler(["d1", "migrations", "list", DATABASE_NAME, ...location]);
  if (!result.ok) {
    throw new Error(`適用先のマイグレーション一覧を取得できませんでした。\n${result.out}`);
  }
  if (/No migrations to apply/.test(result.out)) {
    return [];
  }
  return [...new Set(result.out.match(/\d{4}_[A-Za-z0-9_-]+\.sql/g) ?? [])];
}

/**
 * 使い捨て D1 の SQLite ファイルを探す
 * @param {string} persistDir
 * @returns {string}
 */
function findDatabaseFile(persistDir) {
  const dir = join(persistDir, "v3", "d1", "miniflare-D1DatabaseObject");
  const file = existsSync(dir) ? readdirSync(dir).find((name) => name.endsWith(".sqlite") && name !== "metadata.sqlite") : undefined;
  if (!file) {
    throw new Error("使い捨て D1 のファイルが見つかりません。");
  }
  return join(dir, file);
}

/**
 * 検証対象のテーブル名を取得する（D1・SQLite の内部テーブルを除く）
 * @param {DatabaseSync} db
 * @returns {string[]}
 */
function listTables(db) {
  return db
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name <> 'd1_migrations'")
    .all()
    .map((row) => row.name);
}

/**
 * 外部キーの参照関係（子テーブル → 親テーブル）を取得する
 * @param {DatabaseSync} db
 * @returns {Map<string, { id: number, table: string, from: string, to: string }[]>}
 */
function readForeignKeys(db) {
  return new Map(listTables(db).map((table) => [table, db.prepare(`PRAGMA foreign_key_list("${table}")`).all()]));
}

/**
 * 空のテーブルに検証用の行を1行ずつ入れる（外部キーの親から順に入れる）
 * @param {string} dbFile
 */
function seedEmptyTables(dbFile) {
  const db = new DatabaseSync(dbFile);
  try {
    db.exec("PRAGMA foreign_keys = ON");
    const foreignKeys = readForeignKeys(db);
    const done = new Set();
    const visit = (table) => {
      if (done.has(table)) {
        return;
      }
      done.add(table);
      for (const fk of foreignKeys.get(table) ?? []) {
        if (fk.table !== table) {
          visit(fk.table);
        }
      }
      if (db.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).get().c > 0) {
        return;
      }
      const row = {};
      for (const fk of foreignKeys.get(table) ?? []) {
        if (row[fk.from] === undefined) {
          const parent = db.prepare(`SELECT "${fk.to}" AS v FROM "${fk.table}" LIMIT 1`).get();
          row[fk.from] = parent?.v ?? null;
        }
      }
      for (const column of db.prepare(`PRAGMA table_info("${table}")`).all()) {
        if (row[column.name] === undefined) {
          row[column.name] = /INT|REAL|NUM/i.test(column.type) ? 1 : `check_${table}_${column.name}`;
        }
      }
      const columns = Object.keys(row);
      db.prepare(`INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`)
        .run(...columns.map((c) => row[c]));
    };
    listTables(db).forEach(visit);
  } finally {
    db.close();
  }
}

/**
 * テーブルごとの件数・外部キーの参照関係・外部キーの違反を取得する
 * @param {string} dbFile
 * @returns {{ counts: Map<string, number>, foreignKeys: Map<string, object[]>, violations: object[] }}
 */
function inspect(dbFile) {
  const db = new DatabaseSync(dbFile, { readOnly: true });
  try {
    const counts = new Map(listTables(db).map((table) => [table, db.prepare(`SELECT COUNT(*) AS c FROM "${table}"`).get().c]));
    return { counts, foreignKeys: readForeignKeys(db), violations: db.prepare("PRAGMA foreign_key_check").all() };
  } finally {
    db.close();
  }
}

/**
 * DROP するテーブルの子孫テーブルについて、退避・戻しがそろっているかを確かめる
 * @param {string} sql マイグレーションの SQL
 * @param {Map<string, { table: string }[]>} foreignKeys 適用前の外部キーの参照関係
 * @returns {string[]} そろっていない内容
 */
function checkBackupStatements(sql, foreignKeys) {
  const name = (table) => `[\`"\\[]?${table}[\`"\\]]?`;
  const dropped = [...sql.matchAll(/DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?[`"[]?([A-Za-z0-9_]+)/gi)]
    .map((match) => match[1])
    .filter((table) => !table.startsWith("__"));
  const problems = [];
  for (const target of dropped) {
    const descendants = new Set();
    const queue = [target];
    while (queue.length > 0) {
      const parent = queue.shift();
      for (const [child, fks] of foreignKeys) {
        if (child !== parent && !descendants.has(child) && fks.some((fk) => fk.table === parent)) {
          descendants.add(child);
          queue.push(child);
        }
      }
    }
    for (const table of descendants) {
      const required = [
        [`退避（CREATE TABLE __bak_${table} AS SELECT * FROM ${table}）`, new RegExp(`CREATE\\s+TABLE\\s+${name(`__bak_${table}`)}\\s+AS\\s+SELECT\\s+\\*\\s+FROM\\s+${name(table)}`, "i")],
        [`空にする（DELETE FROM ${table}）`, new RegExp(`DELETE\\s+FROM\\s+${name(table)}\\s*;`, "i")],
        [`戻す（INSERT INTO ${table} SELECT * FROM __bak_${table}）`, new RegExp(`INSERT\\s+INTO\\s+${name(table)}\\s+SELECT\\s+\\*\\s+FROM\\s+${name(`__bak_${table}`)}`, "i")],
        [`退避用テーブルの削除（DROP TABLE __bak_${table}）`, new RegExp(`DROP\\s+TABLE\\s+${name(`__bak_${table}`)}`, "i")],
      ];
      for (const [label, pattern] of required) {
        if (!pattern.test(sql)) {
          problems.push(`${target} を DROP すると子孫テーブル ${table} の行が CASCADE で削除されるが、${label} がない`);
        }
      }
    }
  }
  return problems;
}

/**
 * 使い捨て D1 にマイグレーションを当てる
 * @param {string} configFile
 * @param {string} persistDir
 */
function applyMigrations(configFile, persistDir) {
  const result = wrangler(["d1", "migrations", "apply", CHECK_DATABASE_NAME, "--local", "--persist-to", persistDir, "--config", configFile]);
  if (!result.ok) {
    throw new Error(`使い捨て D1 へのマイグレーションの適用に失敗しました。\n${result.out}`);
  }
}

function main() {
  const { target, dir, appliedUntil } = parseArgs(process.argv.slice(2));
  const files = readdirSync(dir).filter((name) => MIGRATION_FILE.test(name)).sort();
  const pending = appliedUntil
    ? files.filter((name) => name.slice(0, 4) > appliedUntil.slice(0, 4))
    : listPendingMigrations(target);
  const unknown = pending.filter((name) => !files.includes(name));
  if (unknown.length > 0) {
    throw new Error(`適用先の未適用一覧に、手元にないマイグレーションがあります: ${unknown.join(", ")}`);
  }
  if (pending.length === 0) {
    console.log(`[migration-check] ${target}: 未適用のマイグレーションはありません。`);
    return true;
  }
  console.log(`[migration-check] ${target}: 未適用のマイグレーション ${pending.join(", ")} を検証します。`);

  const workDir = mkdtempSync(join(tmpdir(), "migration-check-"));
  try {
    const migrationsDir = join(workDir, "migrations");
    const persistDir = join(workDir, "state");
    const configFile = join(workDir, "wrangler.jsonc");
    mkdirSync(migrationsDir);
    writeFileSync(configFile, JSON.stringify({
      name: "migration-check",
      compatibility_date: "2025-12-31",
      d1_databases: [{ binding: "DB", database_name: CHECK_DATABASE_NAME, database_id: "local", migrations_dir: migrationsDir }],
    }));

    for (const name of files.filter((file) => !pending.includes(file))) {
      copyFileSync(join(dir, name), join(migrationsDir, name));
    }
    applyMigrations(configFile, persistDir);
    if (!existsSync(join(persistDir, "v3"))) {
      wrangler(["d1", "execute", CHECK_DATABASE_NAME, "--local", "--persist-to", persistDir, "--config", configFile, "--command", "SELECT 1"]);
    }
    const dbFile = findDatabaseFile(persistDir);

    for (const name of pending) {
      seedEmptyTables(dbFile);
      const before = inspect(dbFile);
      const problems = checkBackupStatements(readFileSync(join(dir, name), "utf8"), before.foreignKeys);

      copyFileSync(join(dir, name), join(migrationsDir, name));
      applyMigrations(configFile, persistDir);
      const after = inspect(dbFile);
      for (const [table, count] of before.counts) {
        const afterCount = after.counts.get(table);
        if (afterCount !== undefined && afterCount < count) {
          problems.push(`適用後に ${table} の件数が ${count} 件から ${afterCount} 件に減った`);
        }
      }
      if (after.violations.length > 0) {
        problems.push(`適用後に外部キーの違反がある: ${JSON.stringify(after.violations)}`);
      }

      if (problems.length > 0) {
        console.error(`[migration-check] ${name} は適用できません。`);
        problems.forEach((problem) => console.error(`  - ${problem}`));
        console.error("  直し方は .claude/skills/db-migration/SKILL.md を参照してください。");
        return false;
      }
      console.log(`[migration-check] ${name}: 問題なし`);
    }
    return true;
  } finally {
    try {
      rmSync(workDir, { recursive: true, force: true });
    } catch {
      console.warn(`[migration-check] 一時フォルダを削除できませんでした: ${workDir}`);
    }
  }
}

try {
  process.exitCode = main() ? 0 : 1;
} catch (error) {
  console.error(`[migration-check] ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
