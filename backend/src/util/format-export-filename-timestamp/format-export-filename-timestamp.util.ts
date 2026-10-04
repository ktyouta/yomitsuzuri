// 日本標準時（UTC+9）のオフセット（ミリ秒）
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/**
 * エクスポートファイル名用のタイムスタンプ（YYYYMMDDHHmmss）を日本標準時で生成する
 * Cloudflare Workers の実行環境は常にUTCのため、getHours() 等のローカル時刻は使わない
 */
export function formatExportFilenameTimestamp(date: Date): string {
  const jst = new Date(date.getTime() + JST_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  const year = jst.getUTCFullYear();
  const month = pad(jst.getUTCMonth() + 1);
  const day = pad(jst.getUTCDate());
  const hours = pad(jst.getUTCHours());
  const minutes = pad(jst.getUTCMinutes());
  const seconds = pad(jst.getUTCSeconds());
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}
