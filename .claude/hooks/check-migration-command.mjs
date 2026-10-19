/**
 * PreToolUse hook: npm を通さずに yomitsuzuri-db へ `wrangler d1 migrations apply` を実行する前に、
 * backend/scripts/check-migrations.mjs で未適用のマイグレーションを検証する
 * 検証に失敗した場合は終了コード 2 でツールの実行を止める
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const input = JSON.parse(readFileSync(0, "utf8") || "{}");
const command = String(input.tool_input?.command ?? "");

const isDirectApply = /wrangler\s+d1\s+migrations\s+apply\b/.test(command) && /\byomitsuzuri-db\b/.test(command);
const isNpmScript = /npm\s+run\s+db:migrate:/.test(command);
if (!isDirectApply || isNpmScript) {
  process.exit(0);
}

const target = /--remote\b/.test(command) ? "prod" : "local";
const result = spawnSync(
  process.execPath,
  ["--disable-warning=ExperimentalWarning", join(PROJECT_DIR, "backend", "scripts", "check-migrations.mjs"), target],
  { cwd: join(PROJECT_DIR, "backend"), encoding: "utf8" },
);
if (result.status !== 0) {
  process.stderr.write(`${result.stdout ?? ""}${result.stderr ?? ""}`);
  process.exit(2);
}
process.exit(0);
